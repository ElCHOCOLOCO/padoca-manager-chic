import React, { useEffect, useMemo, useRef, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_USER_ID } from "@/config";

type Unidade = "kg" | "ml" | "g" | "l" | "unidade";

type Row = { 
  id: number; 
  nome: string; 
  preco_unitario: number | ""; 
  unidade: Unidade;
  quantidade_receita: number | "";
  valor_total: number;
};

type Recipe = { id: string; name: string; units_per_batch: number; created_at: string };

const initialRows: Row[] = Array.from({ length: 14 }, (_, i) => ({
  id: i + 1,
  nome: `Componente ${i + 1}`,
  preco_unitario: 0,
  unidade: "kg" as Unidade,
  quantidade_receita: 1,
  valor_total: 0,
}));

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function InsumosTabela14() {
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [unidades, setUnidades] = useState<number | "">("");

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);

  const [saveOpen, setSaveOpen] = useState(false);
  const [productName, setProductName] = useState("");
  const [saving, setSaving] = useState(false);
  const [productCosts, setProductCosts] = useState<Record<string, number>>({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  // Debounce timers for inline persistence
  const itemDebounceRef = useRef<Record<number, number>>({});
  const unidadesDebounceRef = useRef<number | null>(null);

  // Calcular valor total para cada linha
  const rowsWithTotal = useMemo(() => {
    return rows.map(row => ({
      ...row,
      valor_total: (typeof row.preco_unitario === "number" && typeof row.quantidade_receita === "number") 
        ? row.preco_unitario * row.quantidade_receita 
        : 0
    }));
  }, [rows]);

  const total = useMemo(
    () => rowsWithTotal.reduce((s, r) => s + r.valor_total, 0),
    [rowsWithTotal]
  );

  const custoPorUnidade = useMemo(() => {
    const u = typeof unidades === "number" ? unidades : 0;
    return u > 0 ? total / u : 0;
  }, [total, unidades]);

  useEffect(() => {
    const loadRecipes = async () => {
      setLoadingRecipes(true);
      try {
        const { data, error } = await supabase
          .from("insumo_recipes")
          .select("id, name, units_per_batch, created_at")
          .order("created_at", { ascending: false });
        
        if (error) {
          console.error(error);
          toast({ title: "Erro ao carregar produtos", description: error.message });
        } else {
          setRecipes((data as any) || []);
          // Carregar custos dos produtos
          await loadProductCosts((data as any) || []);
        }
      } catch (e) {
        console.error("Erro ao carregar receitas:", e);
        toast({ title: "Erro ao carregar produtos", description: "Erro de conexão" });
      } finally {
        setLoadingRecipes(false);
      }
    };
    loadRecipes();
  }, []);

  const loadProductCosts = async (recipesList: Recipe[]) => {
    const costs: Record<string, number> = {};
    
    for (const recipe of recipesList) {
      try {
        // Tentar carregar com as novas colunas primeiro
        let { data, error } = await supabase
          .from("insumo_recipe_items")
          .select("cost, quantity")
          .eq("recipe_id", recipe.id);
        
        // Se falhar, tentar sem as novas colunas (compatibilidade)
        if (error) {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from("insumo_recipe_items")
            .select("cost")
            .eq("recipe_id", recipe.id);
          
          if (fallbackError) continue;
          data = fallbackData;
        }
        
        // Calcular custo total
        const totalCost = (data as any[])?.reduce((sum, item) => {
          const cost = typeof item.cost === "number" ? item.cost : 0;
          const quantity = typeof item.quantity === "number" ? item.quantity : 1;
          return sum + (cost * quantity);
        }, 0) || 0;
        
        costs[recipe.id] = totalCost;
      } catch (e) {
        console.error(`Erro ao carregar custo do produto ${recipe.id}:`, e);
        costs[recipe.id] = 0;
      }
    }
    
    setProductCosts(costs);
  };

  const loadRecipeItems = async (recipeId: string) => {
    const recipe = recipes.find((r) => r.id === recipeId);
    if (recipe) setUnidades(recipe.units_per_batch ?? "");
    
    try {
      // Tentar carregar com as novas colunas primeiro
      let { data, error } = await supabase
        .from("insumo_recipe_items")
        .select("idx, name, cost, unit, quantity")
        .eq("recipe_id", recipeId)
        .order("idx", { ascending: true });
      
      // Se falhar, tentar sem as novas colunas (compatibilidade)
      if (error) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("insumo_recipe_items")
          .select("idx, name, cost")
          .eq("recipe_id", recipeId)
          .order("idx", { ascending: true });
        
        if (fallbackError) {
          toast({ title: "Erro ao carregar itens", description: fallbackError.message });
          return;
        }
        data = fallbackData;
      }
      
      const mapped = initialRows.map((base) => {
        const found = (data as any[])?.find((d) => d.idx === base.id);
        return {
          id: base.id,
          nome: found?.name ?? base.nome,
          preco_unitario: typeof found?.cost === "number" ? Number(found.cost) : 0,
          unidade: found?.unit ?? "kg" as Unidade,
          quantidade_receita: typeof found?.quantity === "number" ? Number(found.quantity) : 1,
          valor_total: 0,
        } as Row;
      });
      setRows(mapped);
      
      // Atualizar custo do produto carregado
      const totalCost = mapped.reduce((sum, row) => {
        const preco = typeof row.preco_unitario === "number" ? row.preco_unitario : 0;
        const quantidade = typeof row.quantidade_receita === "number" ? row.quantidade_receita : 1;
        return sum + (preco * quantidade);
      }, 0);
      
      setProductCosts(prev => ({ ...prev, [recipeId]: totalCost }));
    } catch (e) {
      console.error("Erro ao carregar itens da receita:", e);
      toast({ title: "Erro ao carregar itens", description: "Erro de conexão" });
    }
  };

  const scheduleItemUpsert = (idx: number, nome: string, preco_unitario: number, unidade: Unidade, quantidade_receita: number) => {
    // clear previous
    if (itemDebounceRef.current[idx]) {
      clearTimeout(itemDebounceRef.current[idx]);
    }
    itemDebounceRef.current[idx] = window.setTimeout(async () => {
      if (!selectedRecipeId) return;
      
      try {
        // Tentar salvar com as novas colunas primeiro
        let { error } = await supabase
          .from("insumo_recipe_items")
          .upsert({ 
            recipe_id: selectedRecipeId, 
            idx, 
            name: nome, 
            cost: preco_unitario,
            unit: unidade,
            quantity: quantidade_receita
          }, { onConflict: "recipe_id,idx" });
        
        // Se falhar, tentar sem as novas colunas (compatibilidade)
        if (error) {
          const { error: fallbackError } = await supabase
            .from("insumo_recipe_items")
            .upsert({ 
              recipe_id: selectedRecipeId, 
              idx, 
              name: nome, 
              cost: preco_unitario
            }, { onConflict: "recipe_id,idx" });
          
          if (fallbackError) {
            toast({ title: "Erro ao salvar item", description: fallbackError.message });
          }
        }
      } catch (e) {
        console.error("Erro ao salvar item:", e);
        toast({ title: "Erro ao salvar item", description: "Erro de conexão" });
      }
    }, 400);
  };

  const scheduleUnidadesUpdate = (value: number) => {
    if (unidadesDebounceRef.current) clearTimeout(unidadesDebounceRef.current);
    unidadesDebounceRef.current = window.setTimeout(async () => {
      if (!selectedRecipeId) return;
      try {
        const { error } = await supabase
          .from("insumo_recipes")
          .update({ units_per_batch: value })
          .eq("id", selectedRecipeId);
        if (error) toast({ title: "Erro ao salvar unidades", description: error.message });
      } catch (e) {
        console.error("Erro ao salvar unidades:", e);
        toast({ title: "Erro ao salvar unidades", description: "Erro de conexão" });
      }
    }, 400);
  };

  const handleNomeChange = (id: number, value: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, nome: value } : r)));
    if (selectedRecipeId) {
      const row = rows.find((r) => r.id === id);
      if (row) {
        scheduleItemUpsert(id, value, typeof row.preco_unitario === "number" ? row.preco_unitario : 0, row.unidade, typeof row.quantidade_receita === "number" ? row.quantidade_receita : 1);
      }
    }
  };

  const handlePrecoChange = (id: number, value: string) => {
    const precoNum = value === "" ? 0 : Number(value);
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, preco_unitario: value === "" ? "" : precoNum } : r)));
    if (selectedRecipeId) {
      const row = rows.find((r) => r.id === id);
      if (row) {
        scheduleItemUpsert(id, row.nome, precoNum, row.unidade, typeof row.quantidade_receita === "number" ? row.quantidade_receita : 1);
      }
    }
  };

  const handleUnidadeChange = (id: number, value: Unidade) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, unidade: value } : r)));
    if (selectedRecipeId) {
      const row = rows.find((r) => r.id === id);
      if (row) {
        scheduleItemUpsert(id, row.nome, typeof row.preco_unitario === "number" ? row.preco_unitario : 0, value, typeof row.quantidade_receita === "number" ? row.quantidade_receita : 1);
      }
    }
  };

  const handleQuantidadeChange = (id: number, value: string) => {
    const quantidadeNum = value === "" ? 1 : Number(value);
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, quantidade_receita: value === "" ? "" : quantidadeNum } : r)));
    if (selectedRecipeId) {
      const row = rows.find((r) => r.id === id);
      if (row) {
        scheduleItemUpsert(id, row.nome, typeof row.preco_unitario === "number" ? row.preco_unitario : 0, row.unidade, quantidadeNum);
      }
    }
  };

  const reset = () => {
    setRows(initialRows);
    setUnidades("");
    setSelectedRecipeId(null);
  };

  const handleSaveProduct = async () => {
    try {
      setSaving(true);
      const userId = DEFAULT_USER_ID;

      const { data: recipeInsert, error: recipeErr } = await supabase
        .from("insumo_recipes")
        .insert({ user_id: userId, name: productName.trim() || "Produto sem nome", units_per_batch: typeof unidades === "number" ? unidades : 0 })
        .select("id, name, units_per_batch, created_at")
        .single();

      if (recipeErr) throw recipeErr;

      const recipeId = (recipeInsert as any).id as string;

      const itemsPayload = initialRows.map((base) => {
        const current = rows.find((r) => r.id === base.id) as Row | undefined;
        return {
          recipe_id: recipeId,
          idx: base.id,
          name: (current?.nome ?? base.nome) || base.nome,
          cost: typeof current?.preco_unitario === "number" ? current!.preco_unitario : 0,
          unit: current?.unidade ?? "kg",
          quantity: typeof current?.quantidade_receita === "number" ? current!.quantidade_receita : 1,
        };
      });

      // Tentar salvar com as novas colunas primeiro
      let { error: itemsErr } = await supabase.from("insumo_recipe_items").upsert(itemsPayload, { onConflict: "recipe_id,idx" });
      
      // Se falhar, tentar sem as novas colunas (compatibilidade)
      if (itemsErr) {
        const fallbackPayload = initialRows.map((base) => {
          const current = rows.find((r) => r.id === base.id) as Row | undefined;
          return {
            recipe_id: recipeId,
            idx: base.id,
            name: (current?.nome ?? base.nome) || base.nome,
            cost: typeof current?.preco_unitario === "number" ? current!.preco_unitario : 0,
          };
        });
        
        const { error: fallbackErr } = await supabase.from("insumo_recipe_items").upsert(fallbackPayload, { onConflict: "recipe_id,idx" });
        if (fallbackErr) throw fallbackErr;
      }

      // Calcular custo do novo produto
      const newProductCost = rowsWithTotal.reduce((sum, row) => sum + row.valor_total, 0);
      
      setRecipes((prev) => [{ ...(recipeInsert as any), id: recipeId }, ...prev]);
      setProductCosts(prev => ({ ...prev, [recipeId]: newProductCost }));
      setSelectedRecipeId(recipeId);
      setSaveOpen(false);
      setProductName("");
      toast({ title: "Produto salvo", description: "Seus insumos foram salvos como produto." });
    } catch (e: any) {
      toast({ title: "Erro ao salvar produto", description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteProduct = (recipeId: string) => {
    setProductToDelete(recipeId);
    setDeleteConfirmOpen(true);
  };

  const deleteProduct = async () => {
    if (!productToDelete) return;
    
    try {
      // Primeiro deletar os itens da receita
      const { error: itemsError } = await supabase
        .from("insumo_recipe_items")
        .delete()
        .eq("recipe_id", productToDelete);
      
      if (itemsError) throw itemsError;

      // Depois deletar a receita
      const { error: recipeError } = await supabase
        .from("insumo_recipes")
        .delete()
        .eq("id", productToDelete);
      
      if (recipeError) throw recipeError;

      // Remover da lista local
      setRecipes((prev) => prev.filter((r) => r.id !== productToDelete));
      
      // Remover custo do produto
      setProductCosts(prev => {
        const newCosts = { ...prev };
        delete newCosts[productToDelete];
        return newCosts;
      });
      
      // Se o produto deletado era o selecionado, limpar seleção
      if (selectedRecipeId === productToDelete) {
        setSelectedRecipeId(null);
        setRows(initialRows);
        setUnidades("");
      }

      setDeleteConfirmOpen(false);
      setProductToDelete(null);
      toast({ title: "Produto excluído", description: "Produto e seus itens foram removidos." });
    } catch (e: any) {
      toast({ title: "Erro ao excluir produto", description: e.message });
    }
  };

  return (
    <section aria-labelledby="insumos14-title" className="space-y-4">
      <h2 id="insumos14-title" className="sr-only">Insumos (14 componentes)</h2>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>Componente</TableHead>
            <TableHead>Preço Unitário</TableHead>
            <TableHead>Unidade</TableHead>
            <TableHead>Qtd. na Receita</TableHead>
            <TableHead>Valor Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rowsWithTotal.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="w-10">{r.id}</TableCell>
              <TableCell className="max-w-[200px]">
                <Input
                  value={r.nome}
                  onChange={(e) => handleNomeChange(r.id, e.target.value)}
                  aria-label={`Nome do componente ${r.id}`}
                />
              </TableCell>
              <TableCell className="max-w-[140px]">
                <Input
                  type="number"
                  step="0.01"
                  value={r.preco_unitario === "" ? "" : r.preco_unitario}
                  onChange={(e) => handlePrecoChange(r.id, e.target.value)}
                  placeholder="0,00"
                  aria-label={`Preço unitário do componente ${r.id}`}
                />
              </TableCell>
              <TableCell className="max-w-[100px]">
                <Select value={r.unidade} onValueChange={(value: Unidade) => handleUnidadeChange(r.id, value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                    <SelectItem value="ml">ml</SelectItem>
                    <SelectItem value="l">l</SelectItem>
                    <SelectItem value="unidade">unidade</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="max-w-[140px]">
                <Input
                  type="number"
                  step="0.01"
                  value={r.quantidade_receita === "" ? "" : r.quantidade_receita}
                  onChange={(e) => handleQuantidadeChange(r.id, e.target.value)}
                  placeholder="0,00"
                  aria-label={`Quantidade na receita do componente ${r.id}`}
                />
              </TableCell>
              <TableCell className="max-w-[140px] font-medium">
                {brl.format(r.valor_total)}
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
            onChange={(e) => {
              const v = e.target.value === "" ? "" : Number(e.target.value);
              setUnidades(v);
              if (selectedRecipeId && typeof v === "number") scheduleUnidadesUpdate(v);
            }}
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
        Edite até 14 componentes acima. Para cada item, informe o preço unitário, unidade de medida e quantidade utilizada na receita para calcular o valor total.
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={reset} className="text-sm underline">Limpar</button>
        <Button onClick={() => setSaveOpen(true)} size="sm">Salvar como produto</Button>
      </div>

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar como produto</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Salve esta receita como um produto para reutilizar posteriormente.
            </p>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="productName">Nome do produto</Label>
            <Input id="productName" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Ex: Pão francês" />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSaveOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveProduct} disabled={saving || !productName.trim()}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
            </p>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteConfirmOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={deleteProduct}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <section aria-labelledby="produtos-salvos-title" className="space-y-2">
        <h3 id="produtos-salvos-title" className="text-sm font-medium">Produtos salvos</h3>
        {loadingRecipes ? (
          <div className="text-sm text-muted-foreground">Carregando...</div>
        ) : recipes.length === 0 ? (
          <div className="text-sm text-muted-foreground">Nenhum produto salvo ainda.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {recipes.map((p) => (
              <Card key={p.id} className={p.id === selectedRecipeId ? "ring-2 ring-ring" : undefined}>
                <CardHeader className="py-3">
                  <CardTitle className="text-base">{p.name}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs text-muted-foreground">Lote: {p.units_per_batch}</div>
                    <div className="text-sm font-medium text-green-600">
                      {brl.format(productCosts[p.id] || 0)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      onClick={async () => { setSelectedRecipeId(p.id); await loadRecipeItems(p.id); }}
                      className="flex-1"
                    >
                      Editar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => confirmDeleteProduct(p.id)}
                      className="px-2"
                    >
                      ×
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

export default InsumosTabela14;
