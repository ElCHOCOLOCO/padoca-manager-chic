import React, { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

 type Row = { id: number; nome: string; custo: number | "" };

const initialRows: Row[] = Array.from({ length: 14 }, (_, i) => ({
  id: i + 1,
  nome: `Componente ${i + 1}`,
  custo: 0,
}));

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function InsumosTabela14() {
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [unidades, setUnidades] = useState<number | "">("");

  const total = useMemo(
    () => rows.reduce((s, r) => s + (typeof r.custo === "number" ? r.custo : 0), 0),
    [rows]
  );

  const custoPorUnidade = useMemo(() => {
    const u = typeof unidades === "number" ? unidades : 0;
    return u > 0 ? total / u : 0;
  }, [total, unidades]);

  const handleNomeChange = (id: number, value: string) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, nome: value } : r)));

  const handleCustoChange = (id: number, value: string) =>
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, custo: value === "" ? "" : Number(value) } : r
      )
    );

  const reset = () => {
    setRows(initialRows);
    setUnidades("");
  };

  return (
    <section aria-labelledby="insumos14-title" className="space-y-4">
      <h2 id="insumos14-title" className="sr-only">Insumos (14 componentes)</h2>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>Componente</TableHead>
            <TableHead>Custo (R$)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="w-10">{r.id}</TableCell>
              <TableCell className="max-w-[260px]">
                <Input
                  value={r.nome}
                  onChange={(e) => handleNomeChange(r.id, e.target.value)}
                  aria-label={`Nome do componente ${r.id}`}
                />
              </TableCell>
              <TableCell className="max-w-[160px]">
                <Input
                  type="number"
                  step="0.01"
                  value={r.custo === "" ? "" : r.custo}
                  onChange={(e) => handleCustoChange(r.id, e.target.value)}
                  placeholder="0,00"
                  aria-label={`Custo do componente ${r.id}`}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="grid md:grid-cols-3 gap-4 items-end">
        <div className="md:col-span-1">
          <Label htmlFor="unidades">Unidades produzidas (lote)</Label>
          <Input
            id="unidades"
            type="number"
            min={0}
            value={unidades}
            onChange={(e) => setUnidades(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="Ex: 100"
          />
        </div>
        <div className="md:col-span-2 grid grid-cols-2 gap-4 text-sm">
          <div className="rounded-md border p-3">
            <div className="text-muted-foreground">Total de insumos (lote)</div>
            <div className="text-lg font-semibold">{brl.format(total)}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-muted-foreground">Custo por unidade</div>
            <div className="text-lg font-semibold">{brl.format(custoPorUnidade)}</div>
          </div>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        Edite até 14 componentes acima e informe quantas unidades esse lote produz para calcular o custo por unidade.
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={reset} className="text-sm underline">Limpar</button>
      </div>
    </section>
  );
}

export default InsumosTabela14;
