import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import ExternalIntegrationBridge from "@/components/integration/ExternalIntegrationBridge";
import type { Periodo } from "@/components/integration/types";
import { DEFAULT_INSTITUTE_ID, DEFAULT_USER_ID } from "@/config";

// Periodo type imported from integration/types

interface Entrada {
  id: string;
  user_id: string;
  institute_id: string;
  entry_date: string; // yyyy-MM-dd
  period: Periodo;
  amount: number;
  description: string | null;
}

const STORAGE_KEY_URL = "entradas_external_url";

export default function EntradasPanel() {
  const [period, setPeriod] = useState<Periodo>("daily");
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [entries, setEntries] = useState<Entrada[]>([]);
  const [loading, setLoading] = useState(false);
  const [extUrl, setExtUrl] = useState<string>(() => localStorage.getItem(STORAGE_KEY_URL) || "/plugin/marx-vendas");
  const [instituteId] = useState<string | null>(DEFAULT_INSTITUTE_ID);
  const [userId] = useState<string | null>(DEFAULT_USER_ID);
  const [showEmbed, setShowEmbed] = useState(false);

  const range = useMemo(() => {
    const base = new Date(date + "T00:00:00");
    if (period === "daily") {
      return {
        start: format(base, "yyyy-MM-dd"),
        end: format(base, "yyyy-MM-dd"),
      };
    }
    if (period === "weekly") {
      const s = startOfWeek(base, { weekStartsOn: 1 });
      const e = endOfWeek(base, { weekStartsOn: 1 });
      return { start: format(s, "yyyy-MM-dd"), end: format(e, "yyyy-MM-dd") };
    }
    const s = startOfMonth(base);
    const e = endOfMonth(base);
    return { start: format(s, "yyyy-MM-dd"), end: format(e, "yyyy-MM-dd") };
  }, [period, date]);

  const load = async () => {
    setLoading(true);
    try {
      const q = supabase
        .from("entradas")
        .select("*")
        .eq("period", period)
        .eq("institute_id", DEFAULT_INSTITUTE_ID)
        .gte("entry_date", range.start)
        .lte("entry_date", range.end)
        .order("entry_date", { ascending: true });
      const { data, error } = await q;
      if (error) throw error;
      setEntries((data as any) || []);
    } catch (e: any) {
      toast({ title: "Erro ao carregar entradas", description: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, date]);

  const handleAdd = async () => {
    const amt = Number(amount);
    if (!amt || amt < 0) return toast({ title: "Informe um valor válido" });

    // For weekly/monthly, store entry_date as the selected base date (normalized to start of period for consistency)
    let entryDate = date;
    if (period === "weekly") entryDate = range.start; // start of week
    if (period === "monthly") entryDate = range.start; // first day of month

    const payload = {
      user_id: userId!,
      institute_id: instituteId!,
      entry_date: entryDate,
      period,
      amount: amt,
      description: description || null,
    };
    const { data, error } = await supabase.from("entradas").insert(payload).select();
    if (error) return toast({ title: "Erro ao salvar", description: error.message });
    setEntries((prev) => [...prev, ...(data as any)]);
    setAmount("");
    setDescription("");
    toast({ title: "Entrada registrada" });
  };

  const handleUpdate = async (row: Entrada) => {
    const { error } = await supabase
      .from("entradas")
      .update({ amount: row.amount, description: row.description })
      .eq("id", row.id)
      .select();
    if (error) return toast({ title: "Erro ao atualizar", description: error.message });
    toast({ title: "Entrada atualizada" });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("entradas").delete().eq("id", id);
    if (error) return toast({ title: "Erro ao excluir", description: error.message });
    setEntries((prev) => prev.filter((e) => e.id !== id));
    toast({ title: "Entrada removida" });
  };

  const totalPeriodo = useMemo(() => entries.reduce((s, r) => s + Number(r.amount || 0), 0), [entries]);

  const saveUrl = () => {
    localStorage.setItem(STORAGE_KEY_URL, extUrl.trim());
    toast({ title: "URL salva" });
  };

  return (
    <div className="space-y-6">
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle>Entradas por período</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-5 gap-2">
            <div>
              <Label>Período</Label>
              <Select value={period} onValueChange={(v: Periodo) => setPeriod(v)}>
                <SelectTrigger><SelectValue placeholder="Período" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Dia</SelectItem>
                  <SelectItem value="weekly">Semana</SelectItem>
                  <SelectItem value="monthly">Mês</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data base</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              <p className="text-xs text-muted-foreground mt-1">
                {period === "daily" && `Dia ${format(new Date(date + 'T00:00:00'), 'dd/MM/yyyy')}`}
                {period === "weekly" && `Semana ${format(new Date(range.start + 'T00:00:00'), 'dd/MM')} – ${format(new Date(range.end + 'T00:00:00'), 'dd/MM')}`}
                {period === "monthly" && `Mês ${format(new Date(range.start + 'T00:00:00'), 'MM/yyyy')}`}
              </p>
            </div>
            <div>
              <Label>Valor</Label>
              <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="R$" />
            </div>
            <div className="md:col-span-2">
              <Label>Descrição (opcional)</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: repasse, patrocínio…" />
            </div>
            <div className="md:col-span-5">
              <Button onClick={handleAdd} disabled={loading}>Adicionar entrada</Button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total do período selecionado</span>
            <strong>R$ {totalPeriodo.toFixed(2)}</strong>
          </div>
        </CardContent>
      </Card>

      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle>Lista de entradas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap">{r.entry_date}</TableCell>
                  <TableCell>{r.period}</TableCell>
                  <TableCell className="max-w-[140px]">
                    <Input
                      type="number"
                      step="0.01"
                      value={r.amount}
                      onChange={(e) => setEntries((prev) => prev.map((it) => (it.id === r.id ? { ...it, amount: Number(e.target.value || 0) } : it)))}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={r.description ?? ""}
                      onChange={(e) => setEntries((prev) => prev.map((it) => (it.id === r.id ? { ...it, description: e.target.value } : it)))}
                    />
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => handleUpdate(r)}>Salvar</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(r.id)}>Excluir</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {entries.length === 0 && (
            <p className="text-sm text-muted-foreground mt-4">Nenhuma entrada encontrada no período.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integração externa</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-2">
          <div className="md:col-span-2">
            <Label>URL do aplicativo externo</Label>
            <Input value={extUrl} onChange={(e) => setExtUrl(e.target.value)} placeholder="https://sua-integracao.com/app" />
            <p className="text-xs text-muted-foreground mt-1">Guardei localmente no seu navegador. O app recebe contexto via querystring e postMessage.</p>
          </div>
          <div className="flex items-end gap-2">
            <Button variant="secondary" onClick={saveUrl}>Salvar URL</Button>
            <a href={extUrl || "#"} target="_blank" rel="noreferrer">
              <Button disabled={!extUrl}>Abrir nova aba</Button>
            </a>
            <Button onClick={() => {
              if (!extUrl) return toast({ title: "Informe a URL" });
              setShowEmbed(true);
            }} disabled={!extUrl}>
              Integrar na página
            </Button>
          </div>
        </CardContent>
      </Card>

      {showEmbed && extUrl && (
        <ExternalIntegrationBridge
          url={extUrl}
          period={period}
          dateRange={range}
          userId={userId}
          instituteId={instituteId}
          onClose={() => setShowEmbed(false)}
        />
      )}

    </div>
  );
}
