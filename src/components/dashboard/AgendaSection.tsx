import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import PageTurn from "@/components/ui/PageTurn";
import { AgendaItem } from "../../types/dashboard";

interface AgendaSectionProps {
  agenda: AgendaItem[];
  setAgenda: React.Dispatch<React.SetStateAction<AgendaItem[]>>;
  addAgendaItem: (e: React.FormEvent<HTMLFormElement>) => void;
  deleteAgendaItem: (id: string) => void;
}

const AgendaSection: React.FC<AgendaSectionProps> = ({
  agenda,
  setAgenda,
  addAgendaItem,
  deleteAgendaItem
}) => {
  return (
    <PageTurn pageKey="agenda">
      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
          <Card className="border-4 border-foreground rounded-none bg-background shadow-none">
            <CardHeader className="bg-foreground text-background py-4">
              <CardTitle className="text-xl font-black uppercase italic flex items-center gap-3">
                <CalendarIcon size={20}/> Novo Compromisso
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-8">
              <form onSubmit={addAgendaItem} className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest">Data</Label>
                  <Input name="data" type="date" className="rounded-none border-2 border-foreground h-12 font-bold" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest">Título do Evento</Label>
                  <Input name="titulo" className="rounded-none border-2 border-foreground h-12 font-bold" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest">Notas / Objetivos</Label>
                  <Input name="notas" className="rounded-none border-2 border-foreground h-12 italic" />
                </div>
                <Button type="submit" className="w-full h-14 rounded-none border-4 border-foreground bg-foreground text-background font-black uppercase italic hover:bg-background hover:text-foreground transition-all">Protocolar Evento</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8">
          <div className="border-4 border-foreground bg-background p-6 min-h-[500px]">
            <header className="border-b-4 border-foreground mb-8 pb-4 flex justify-between items-baseline">
              <h2 className="text-5xl font-black uppercase tracking-tighter">Cronograma de Luta</h2>
              <span className="text-xs font-bold uppercase opacity-60 italic">Planejamento Estratégico Diário</span>
            </header>
            <div className="space-y-6">
              {agenda.sort((a,b) => new Date(a.data).getTime() - new Date(b.data).getTime()).map(item => (
                <div key={item.id} className="flex gap-6 border-l-8 border-foreground pl-6 py-2 group hover:bg-muted/30 transition-colors">
                  <div className="w-32 flex flex-col items-center justify-center border-2 border-foreground p-2 h-fit bg-background">
                    <span className="text-2xl font-black font-serif italic">{new Date(item.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest bg-foreground text-background w-full text-center py-0.5 mt-1">{new Date(item.data).toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-2xl font-black uppercase tracking-tight italic leading-none">{item.titulo}</h4>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0 border-2 border-foreground rounded-none" onClick={() => deleteAgendaItem(item.id)}>✕</Button>
                    </div>
                    <p className="text-sm font-bold uppercase opacity-70 italic flex items-center gap-2"><Clock size={14}/> {item.notas || "Sem observações adicionais."}</p>
                  </div>
                </div>
              ))}
              {agenda.length === 0 && (
                <div className="text-center py-20 border-2 border-dashed border-foreground/20">
                  <p className="text-xl font-bold uppercase italic opacity-40">Nenhum evento protocolado no cronograma.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageTurn>
  );
};

export default AgendaSection;
