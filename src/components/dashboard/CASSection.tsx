import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageTurn from "@/components/ui/PageTurn";

interface CA {
  id: string;
  nome: string;
  status: string;
  relacao: string;
  oportunidades?: string;
}

interface CASSectionProps {
  cas: CA[];
  editingCA: string | null;
  setEditingCA: (id: string | null) => void;
  addCA: (e: React.FormEvent<HTMLFormElement>) => void;
  updateCA: (id: string, updates: Partial<CA>) => void;
  deleteCA: (id: string) => void;
}

const CASSection: React.FC<CASSectionProps> = ({
  cas,
  editingCA,
  setEditingCA,
  addCA,
  updateCA,
  deleteCA
}) => {
  return (
    <PageTurn pageKey="cas">
      <div className="border-4 border-foreground bg-background p-8">
        <header className="border-b-4 border-foreground mb-8 pb-4">
          <h2 className="text-5xl font-black uppercase tracking-tighter">Mapeamento de Aliados (CAs)</h2>
          <p className="italic font-bold opacity-70">Monitoramento constante da recepção acadêmica e potencial de repasse.</p>
        </header>
        <form onSubmit={addCA} className="grid md:grid-cols-6 gap-4 mb-12 bg-muted/30 p-4 border-2 border-foreground">
          <div className="md:col-span-2"><Label className="text-[10px] font-black uppercase">Nome do CA</Label><Input name="nome" className="rounded-none border-2 border-foreground h-10" /></div>
          <div>
            <Label className="text-[10px] font-black uppercase">Status</Label>
            <Select name="status" defaultValue="neutro">
              <SelectTrigger className="rounded-none border-2 border-foreground h-10"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="aliado">Aliado</SelectItem><SelectItem value="neutro">Neutro</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="md:col-span-3"><Label className="text-[10px] font-black uppercase">Relação / Humor / Desafios</Label><Input name="relacao" placeholder="Ex: Estável / Ativo / Burocracia" className="rounded-none border-2 border-foreground h-10 italic" /></div>
          <Button type="submit" className="md:col-span-6 h-12 rounded-none border-4 border-foreground bg-foreground text-background font-black uppercase italic shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">Mapear Entidade</Button>
        </form>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cas.map(ca => {
            const isEditing = editingCA === ca.id;
            return (
              <div key={ca.id} className="border-2 border-foreground p-4 bg-background hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col justify-between">
                {isEditing ? (
                  <div className="space-y-3">
                    <Input 
                      defaultValue={ca.nome} 
                      className="rounded-none border-2 border-foreground font-black uppercase h-8"
                      onBlur={(e) => updateCA(ca.id, { nome: e.target.value })}
                    />
                    <Select 
                      defaultValue={ca.status} 
                      onValueChange={(v) => updateCA(ca.id, { status: v })}
                    >
                      <SelectTrigger className="rounded-none border-2 border-foreground h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aliado">Aliado</SelectItem>
                        <SelectItem value="neutro">Neutro</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input 
                      defaultValue={ca.relacao} 
                      className="rounded-none border-2 border-foreground italic h-8"
                      onBlur={(e) => updateCA(ca.id, { relacao: e.target.value })}
                    />
                    <Button 
                      className="w-full h-8 rounded-none bg-foreground text-background font-black text-[10px] uppercase"
                      onClick={() => setEditingCA(null)}
                    >
                      Salvar
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-4 border-b border-foreground/20 pb-2">
                      <h4 className="text-2xl font-black uppercase leading-none">{ca.nome}</h4>
                      <Badge className={cn("rounded-none font-black uppercase text-[10px]", ca.status === 'aliado' ? 'bg-green-600' : 'bg-foreground')}>{ca.status}</Badge>
                    </div>
                    <div className="space-y-2 mb-4">
                      <p className="text-sm italic"><strong>Relação:</strong> {ca.relacao}</p>
                      <p className="text-sm"><strong>Oportunidades:</strong> {ca.oportunidades || '—'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" className="rounded-none border-2 border-foreground font-black text-[10px] uppercase" onClick={() => setEditingCA(ca.id)}>Editar</Button>
                      <Button variant="outline" size="sm" className="rounded-none border-2 border-foreground font-black text-[10px] uppercase hover:bg-red-600 hover:text-white" onClick={() => deleteCA(ca.id)}>Remover</Button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </PageTurn>
  );
};

// Helper function for class merging
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export default CASSection;
