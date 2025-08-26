import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import ExternalIntegrationBridge from "@/components/integration/ExternalIntegrationBridge";
import type { Periodo } from "@/components/integration/types";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from "date-fns";
import { DEFAULT_INSTITUTE_ID, DEFAULT_USER_ID } from "@/config";

const STORAGE_KEY_URL = "integration_external_url";

export default function IntegrationTab() {
  const [url, setUrl] = useState<string>(() => localStorage.getItem(STORAGE_KEY_URL) || "https://v0-vendedor-app.vercel.app/embed");
  const [period, setPeriod] = useState<Periodo>("daily");
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0,10));
  const [show, setShow] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [userId] = useState<string | null>(DEFAULT_USER_ID);
  const [instituteId] = useState<string | null>(DEFAULT_INSTITUTE_ID);
  const preflightRef = useRef<HTMLIFrameElement | null>(null);

  const range = useMemo(() => {
    const base = new Date(date + "T00:00:00");
    if (period === "daily") return { start: format(base, "yyyy-MM-dd"), end: format(base, "yyyy-MM-dd") };
    if (period === "weekly") {
      const s = startOfWeek(base, { weekStartsOn: 1 });
      const e = endOfWeek(base, { weekStartsOn: 1 });
      return { start: format(s, "yyyy-MM-dd"), end: format(e, "yyyy-MM-dd") };
    }
    const s = startOfMonth(base);
    const e = endOfMonth(base);
    return { start: format(s, "yyyy-MM-dd"), end: format(e, "yyyy-MM-dd") };
  }, [period, date]);

  const saveUrl = () => {
    localStorage.setItem(STORAGE_KEY_URL, url.trim());
    toast({ title: "URL salva" });
  };

  const handleConnect = async () => {
    if (!url) return toast({ title: 'Informe a URL'});
    setConnecting(true);
    const testUrl = (() => {
      try {
        const u = new URL(url, window.location.origin);
        u.searchParams.set('period', period);
        u.searchParams.set('start', range.start);
        u.searchParams.set('end', range.end);
        u.searchParams.set('user_id', DEFAULT_USER_ID);
        u.searchParams.set('institute_id', DEFAULT_INSTITUTE_ID);
        return u.toString();
      } catch { return url; }
    })();

    const iframe = document.createElement('iframe');
    preflightRef.current = iframe;
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    iframe.sandbox.add("allow-scripts");
    iframe.sandbox.add("allow-forms");
    iframe.sandbox.add("allow-same-origin");
    iframe.src = testUrl;
    document.body.appendChild(iframe);

    let done = false;
    const origin = (() => { try { return new URL(url, window.location.origin).origin; } catch { return '*'; } })();

    const onMsg = (e: MessageEvent) => {
      if (origin !== '*' && e.origin !== origin) return;
      const t = (e.data||{}).type;
      if (t === 'EXT_INIT' || t === 'HOST_READY' || t === 'CONTEXT_DATA') {
        done = true;
        cleanup();
        setShow(true);
        setConnecting(false);
        toast({ title: 'Conectado' });
      }
    };
    window.addEventListener('message', onMsg);

    const cleanup = () => {
      window.removeEventListener('message', onMsg);
      try { preflightRef.current?.remove(); } catch {}
      preflightRef.current = null;
    };

    setTimeout(() => {
      if (done) return;
      cleanup();
      setConnecting(false);
      toast({ title: 'Falha na conexão', description: 'Não houve handshake do embed.' });
    }, 4000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configurar integração externa</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-2">
          <div className="md:col-span-2">
            <Label>URL do aplicativo</Label>
            <Input value={url} onChange={(e)=> setUrl(e.target.value)} placeholder="https://seu-app.com/embed" />
            <p className="text-xs text-muted-foreground mt-1">A URL é salva localmente e recebe contexto via querystring e postMessage.</p>
          </div>
          <div className="flex items-end gap-2">
            <Button variant="secondary" onClick={saveUrl}>Salvar URL</Button>
            <a href={url || '#'} target="_blank" rel="noreferrer"><Button disabled={!url}>Abrir em nova aba</Button></a>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contexto</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-4 gap-2">
          <div>
            <Label>Período</Label>
            <select className="border rounded-md px-3 py-2 bg-background w-full" value={period} onChange={(e)=> setPeriod(e.target.value as Periodo)}>
              <option value="daily">Diário</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensal</option>
            </select>
          </div>
          <div>
            <Label>Data base</Label>
            <Input type="date" value={date} onChange={(e)=> setDate(e.target.value)} />
            <p className="text-xs text-muted-foreground mt-1">
              {period === 'daily' && `Dia ${format(new Date(date+'T00:00:00'), 'dd/MM/yyyy')}`}
              {period === 'weekly' && `Semana ${format(new Date(range.start+'T00:00:00'), 'dd/MM')} – ${format(new Date(range.end+'T00:00:00'), 'dd/MM')}`}
              {period === 'monthly' && `Mês ${format(new Date(range.start+'T00:00:00'), 'MM/yyyy')}`}
            </p>
          </div>
          <div className="col-span-2 flex items-end gap-2">
            <Button onClick={handleConnect} disabled={!url || connecting}>{connecting ? 'Conectando…' : 'Conectar'}</Button>
          </div>
        </CardContent>
      </Card>

      {show && url && (
        <ExternalIntegrationBridge
          url={url}
          period={period}
          dateRange={range}
          userId={userId}
          instituteId={instituteId}
          onClose={()=> setShow(false)}
          onConnected={()=> toast({ title: 'Handshake ok' })}
          onError={(m)=> toast({ title: 'Erro integração', description: m })}
        />
      )}
    </div>
  );
}
