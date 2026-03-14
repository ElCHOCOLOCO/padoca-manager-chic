import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import PageTurn from "@/components/ui/PageTurn";
import ShiftChecklist from "@/components/ShiftChecklist";

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  category: 'rotina' | 'lenin';
}

interface ProtocoloSectionProps {
  checklistItems: ChecklistItem[];
  setChecklistItems: React.Dispatch<React.SetStateAction<ChecklistItem[]>>;
  notifyOk: (msg: string) => void;
}

const ProtocoloSection: React.FC<ProtocoloSectionProps> = ({ 
  checklistItems, 
  setChecklistItems, 
  notifyOk 
}) => {
  return (
    <PageTurn pageKey="protocolo">
      <div className="grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 space-y-12">
          <ShiftChecklist 
            title="Tarefas Rotineiras"
            items={checklistItems.filter(i => i.category === 'rotina')} 
            onToggle={(id) => setChecklistItems(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item))}
            onRemove={(id) => setChecklistItems(prev => prev.filter(item => item.id !== id))}
            onComplete={() => notifyOk("Rotina arquivada.")} 
          />

          <ShiftChecklist 
            title="O que fazer de Lênin"
            items={checklistItems.filter(i => i.category === 'lenin')} 
            onToggle={(id) => setChecklistItems(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item))}
            onRemove={(id) => setChecklistItems(prev => prev.filter(item => item.id !== id))}
            onComplete={() => notifyOk("Análise concluída.")} 
          />
        </div>
        <div className="lg:col-span-5">
          <Card className="border-4 border-foreground rounded-none bg-background shadow-none h-full">
            <CardHeader className="border-b-4 border-foreground bg-muted/50">
              <CardTitle className="text-xl font-black uppercase italic">Gerenciar Protocolo</CardTitle>
            </CardHeader>
            <CardContent className="pt-8">
              <form onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const label = String(fd.get("label") || "");
                const category = String(fd.get("category") || "rotina") as 'rotina' | 'lenin';
                if (!label) return;
                setChecklistItems(p => [...p, { id: Date.now().toString(), label, checked: false, category }]);
                e.currentTarget.reset();
                notifyOk("Demanda incorporada ao protocolo.");
              }} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Nova Demanda</Label>
                  <Input name="label" placeholder="Ex: Higienização de bancadas" className="rounded-none border-2 border-foreground font-bold h-12 focus-visible:ring-0" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Quadro / Origem</Label>
                  <select name="category" className="w-full h-12 border-2 border-foreground bg-background rounded-none px-3 font-black uppercase text-xs italic focus-visible:ring-0">
                    <option value="rotina">Tarefas Rotineiras</option>
                    <option value="lenin">O que fazer de Lênin</option>
                  </select>
                </div>
                <Button type="submit" className="w-full h-12 rounded-none bg-foreground text-background font-black uppercase italic hover:bg-background hover:text-foreground transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none">
                  ⊕ Anexar ao Protocolo
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTurn>
  );
};

export default ProtocoloSection;
