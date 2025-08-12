import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ExternalIntegrationBridge from "@/components/integration/ExternalIntegrationBridge";
import type { Periodo } from "@/components/integration/types";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from "date-fns";

const STORAGE_KEY_URL = "integration_external_url";

export default function IntegrationTab() {
  const [url, setUrl] = useState<string>(() => localStorage.getItem(STORAGE_KEY_URL) || "");
  const [period, setPeriod] = useState<Periodo>("daily");
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0,10));
  const [show, setShow] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [instituteId, setInstituteId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: auth } = await supabase.auth.getUser();
      setUserId(auth.user?.id ?? null);
      const { data: iid } = await supabase.rpc("get_current_user_institute");
      setInstituteId((iid as any) ?? null);
    };
    init();
  }, []);

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
            <Button onClick={()=> {
              if (!url) return toast({ title: 'Informe a URL'});
              if (!userId) return toast({ title: 'Autentique-se' });
              if (!instituteId) return toast({ title: 'Configure seu instituto' });
              setShow(true);
            }}>Integrar na página</Button>
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
        />
      )}
    </div>
  );
}
