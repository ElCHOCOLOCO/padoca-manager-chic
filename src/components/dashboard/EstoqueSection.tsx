import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";
import PageTurn from "@/components/ui/PageTurn";
import { ItemEstoque } from "../../types/dashboard";

interface EstoqueSectionProps {
  estoque: ItemEstoque[];
  setEstoque: React.Dispatch<React.SetStateAction<ItemEstoque[]>>;
  notifyOk: (msg: string) => void;
}

const EstoqueSection: React.FC<EstoqueSectionProps> = ({ 
  estoque, 
  setEstoque, 
  notifyOk 
}) => {
  return (
    <PageTurn pageKey="estoque">
      <div className="space-y-12">
        <header className="max-w-4xl mx-auto text-center border-double border-b-8 border-foreground pb-8">
          <h2 className="text-6xl font-black uppercase tracking-tighter italic mb-4">Armazém e Suprimentos</h2>
          <p className="text-xl font-bold uppercase tracking-widest max-w-2xl mx-auto italic opacity-70">Controle rigoroso das matérias-primas para evitar o desperdício do valor-trabalho.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <Card className="border-4 border-foreground rounded-none bg-background shadow-none h-full sticky top-8">
              <CardHeader className="bg-foreground text-background py-4">
                <CardTitle className="text-xl font-black uppercase italic flex items-center gap-3"><Package size={20}/> Novo Registro</CardTitle>
              </CardHeader>
              <CardContent className="pt-8">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const produto = String(fd.get('produto'));
                  const uso = Number(fd.get('uso'));
                  const unid = Number(fd.get('unid'));
                  if(produto) {
                    setEstoque([...estoque, { id: crypto.randomUUID(), produto, uso_semanal: uso, unidades: unid }]);
                    e.currentTarget.reset();
                    notifyOk("Insumo catalogado.");
                  }
                }} className="space-y-6">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Produto</Label>
                    <Input name="produto" className="rounded-none border-2 border-foreground font-bold h-12" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Uso Semanal</Label>
                    <Input name="uso" type="number" className="rounded-none border-2 border-foreground h-12 font-serif text-xl italic" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Qtd Atual (Unid)</Label>
                    <Input name="unid" type="number" className="rounded-none border-2 border-foreground h-12 font-serif text-xl italic" />
                  </div>
                  <Button type="submit" className="w-full h-14 rounded-none border-4 border-foreground bg-foreground text-background font-black uppercase italic hover:bg-background hover:text-foreground transition-all">Incorporar ao Estoque</Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3 grid md:grid-cols-2 gap-6">
            {estoque.map(item => (
              <div key={item.id} className="border-4 border-foreground bg-background p-6 flex flex-col justify-between group relative overflow-hidden">
                <div className="absolute top-(-20px) right-(-20px) text-9xl font-black opacity-[0.03] pointer-events-none uppercase italic">{item.produto.charAt(0)}</div>
                <div className="flex justify-between items-start mb-8 border-b-2 border-foreground pb-4">
                  <h4 className="text-4xl font-black uppercase tracking-tighter leading-none italic">{item.produto}</h4>
                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0 rounded-none border-2 border-foreground" onClick={() => setEstoque(estoque.filter(i => i.id !== item.id))}>✕</Button>
                </div>
                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest opacity-60">Uso Semanal</Label>
                    <div className="flex items-center gap-2 border-b-4 border-foreground/20 pb-2">
                      <Input 
                        value={item.uso_semanal}
                        type="number"
                        onChange={(e) => setEstoque(estoque.map(i => i.id === item.id ? { ...i, uso_semanal: Number(e.target.value) } : i))}
                        className="border-none bg-transparent h-12 p-0 text-4xl font-serif italic text-center focus-visible:ring-0"
                      />
                      <span className="text-xs font-black uppercase pt-4">unid</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest opacity-60">Unidades Disponíveis</Label>
                    <div className="flex items-center gap-2 border-b-4 border-foreground/20 pb-2">
                      <Input 
                        value={item.unidades}
                        type="number"
                        onChange={(e) => setEstoque(estoque.map(i => i.id === item.id ? { ...i, unidades: Number(e.target.value) } : i))}
                        className="border-none bg-transparent h-12 p-0 text-4xl font-serif italic text-center focus-visible:ring-0"
                      />
                      <span className="text-xs font-black uppercase pt-4">unid</span>
                    </div>
                  </div>
                </div>
                
                {item.unidades < item.uso_semanal && (
                  <div className="bg-red-600 text-white p-2 text-center font-black uppercase italic animate-pulse">
                    ⚠️ Alerta: Estoque Crítico
                  </div>
                )}
                {item.unidades >= item.uso_semanal && item.unidades < item.uso_semanal * 2 && (
                  <div className="bg-amber-500 text-black p-2 text-center font-black uppercase italic">
                    📦 Reposição Necessária
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageTurn>
  );
};

export default EstoqueSection;
