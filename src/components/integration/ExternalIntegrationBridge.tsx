import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CreateEntryPayload, DeleteEntryPayload, ExtMessage, HostContext, MSG, Periodo, RequestEntriesPayload, UpdateEntryPayload } from "./types";

function getOrigin(url: string | null) {
  try { return url ? new URL(url).origin : "*"; } catch { return "*"; }
}

function buildUrl(base: string, ctx: HostContext) {
  try {
    const u = new URL(base);
    u.searchParams.set("period", ctx.period);
    u.searchParams.set("start", ctx.range.start);
    u.searchParams.set("end", ctx.range.end);
    if (ctx.userId) u.searchParams.set("user_id", ctx.userId);
    if (ctx.instituteId) u.searchParams.set("institute_id", ctx.instituteId);
    return u.toString();
  } catch {
    return base;
  }
}

export default function ExternalIntegrationBridge({
  url,
  period,
  dateRange,
  userId,
  instituteId,
  onClose,
}: {
  url: string;
  period: Periodo;
  dateRange: { start: string; end: string };
  userId: string | null;
  instituteId: string | null;
  onClose: () => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [connected, setConnected] = useState(false);
  const targetOrigin = useMemo(() => getOrigin(url), [url]);

  const ctx: HostContext = useMemo(() => ({
    userId,
    instituteId,
    period,
    range: dateRange,
  }), [userId, instituteId, period, dateRange]);

  useEffect(() => {
    const handler = async (e: MessageEvent) => {
      if (targetOrigin !== "*" && e.origin !== targetOrigin) return;
      const msg = e.data as ExtMessage;
      if (!msg || !msg.type) return;

      try {
        switch (msg.type) {
          case MSG.EXT_INIT: {
            setConnected(true);
            post({ type: MSG.HOST_READY, payload: ctx });
            break;
          }
          case MSG.REQUEST_CONTEXT: {
            post({ type: MSG.CONTEXT_DATA, payload: ctx });
            break;
          }
          case MSG.REQUEST_ENTRIES: {
            const p = (msg.payload || {}) as RequestEntriesPayload;
            const prd = p.period ?? ctx.period;
            const start = p.start ?? ctx.range.start;
            const end = p.end ?? ctx.range.end;
            const { data, error } = await supabase
              .from("entradas")
              .select("*")
              .eq("period", prd)
              .gte("entry_date", start)
              .lte("entry_date", end)
              .order("entry_date", { ascending: true });
            if (error) throw error;
            post({ type: MSG.ENTRIES_DATA, payload: data });
            break;
          }
          case MSG.CREATE_ENTRY: {
            const p = (msg.payload || {}) as CreateEntryPayload;
            const payload = {
              user_id: ctx.userId,
              institute_id: ctx.instituteId,
              entry_date: p.entry_date ?? ctx.range.start,
              period: p.period ?? ctx.period,
              amount: p.amount,
              description: p.description ?? null,
            };
            const { data, error } = await supabase.from("entradas").insert(payload).select();
            if (error) throw error;
            post({ type: MSG.ENTRY_CREATED, payload: data?.[0] });
            break;
          }
          case MSG.UPDATE_ENTRY: {
            const p = (msg.payload || {}) as UpdateEntryPayload;
            const { error } = await supabase.from("entradas").update({ amount: p.amount, description: p.description }).eq("id", p.id).select();
            if (error) throw error;
            post({ type: MSG.ENTRY_UPDATED, payload: { id: p.id } });
            break;
          }
          case MSG.DELETE_ENTRY: {
            const p = (msg.payload || {}) as DeleteEntryPayload;
            const { error } = await supabase.from("entradas").delete().eq("id", p.id);
            if (error) throw error;
            post({ type: MSG.ENTRY_DELETED, payload: { id: p.id } });
            break;
          }
          default:
            break;
        }
      } catch (err: any) {
        post({ type: MSG.ERROR, payload: { message: err.message } });
        toast({ title: "Integração: erro", description: err.message });
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetOrigin, ctx]);

  const post = (m: ExtMessage) => {
    const contentWindow = iframeRef.current?.contentWindow;
    if (!contentWindow) return;
    contentWindow.postMessage(m, targetOrigin === "*" ? "*" : targetOrigin);
  };

  const fullUrl = useMemo(() => buildUrl(url, ctx), [url, ctx]);

  return (
    <Card className="mt-4">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Integração externa</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant={connected ? "default" : "secondary"}>{connected ? "Conectado" : "Aguardando"}</Badge>
          <Button size="sm" variant="secondary" onClick={() => post({ type: MSG.REQUEST_CONTEXT })}>Reenviar contexto</Button>
          <Button size="sm" variant="destructive" onClick={onClose}>Fechar</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-xs text-muted-foreground mb-2">Destino: {getOrigin(url)}</div>
        <iframe
          ref={iframeRef}
          title="External Integration"
          src={fullUrl}
          className="w-full h-[600px] rounded-md border"
          sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
        />
      </CardContent>
    </Card>
  );
}
