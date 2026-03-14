import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Users, GraduationCap } from "lucide-react";
import PageTurn from "@/components/ui/PageTurn";
import { Camarada, HorarioDisponivel } from "../../types/dashboard";
import { dias, labelDia, labelTurno, Turno, DiaSemana } from "../../constants/dashboard";

interface CamaradasSectionProps {
  camaradas: Camarada[];
  addCamarada: (e: React.FormEvent<HTMLFormElement>) => void;
  deleteCamarada: (id: string, nome: string) => void;
}

const CamaradasSection: React.FC<CamaradasSectionProps> = ({ 
  camaradas, 
  addCamarada, 
  deleteCamarada 
}) => {
  return (
    <PageTurn pageKey="camaradas">
      <div className="grid md:grid-cols-12 gap-8">
        <div className="md:col-span-12 lg:col-span-4 space-y-8">
          <Card className="border-4 border-foreground rounded-none bg-background shadow-none">
            <CardHeader className="border-b-4 border-foreground bg-foreground text-background py-4">
              <CardTitle className="text-2xl font-black uppercase italic flex items-center gap-3">
                <Users size={24}/> Alistamento
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-8">
              <form onSubmit={addCamarada} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest">Nome do Camarada</Label>
                  <Input name="nome" placeholder="Ex: Lucas" className="rounded-none border-2 border-foreground h-12 font-bold text-lg focus-visible:ring-0" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest">Faculdade/Curso</Label>
                  <Input name="curso" placeholder="Ex: História" className="rounded-none border-2 border-foreground h-12 italic focus-visible:ring-0" />
                </div>
                
                <div className="space-y-4 pt-4 border-t-2 border-foreground/10">
                  <Label className="text-xs font-black uppercase tracking-widest block mb-4">Escala de Disponibilidade</Label>
                  <div className="grid grid-cols-5 gap-2">
                    {dias.map(d => (
                      <div key={d} className="space-y-2 text-center border-r border-foreground/10 last:border-0 pr-1">
                        <span className="text-[10px] font-black uppercase opacity-60 block mb-1">{labelDia[d]}</span>
                        {(['manha', 'tarde', 'noite'] as Turno[]).map(t => (
                          <div key={t} className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[10px] font-black text-foreground uppercase">{t === 'manha' ? 'M' : t === 'tarde' ? 'T' : 'N'}</span>
                            <input type="checkbox" name={`${d}-${t}`} className="w-4 h-4 accent-foreground cursor-pointer border-2 border-foreground rounded-none" title={`${labelDia[d]} - ${labelTurno[t]}`} />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                <Button type="submit" className="w-full h-16 rounded-none border-4 border-foreground bg-foreground text-background font-black text-xl uppercase italic hover:bg-background hover:text-foreground transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none translate-x-[-2px] translate-y-[-2px] hover:translate-x-0 hover:translate-y-0 active:scale-95 mt-4">
                  Comissionar Quadro
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-12 lg:col-span-8">
          <div className="border-4 border-foreground bg-background p-1 min-h-[600px]">
            <div className="border-2 border-foreground p-6">
              <header className="border-b-2 border-foreground mb-6 pb-4 flex justify-between items-end">
                <h3 className="text-4xl font-black uppercase tracking-tighter">Quadro de Camaradas</h3>
                <span className="text-xs font-bold uppercase opacity-60">Total de membros: {camaradas.length}</span>
              </header>
              <div className="grid md:grid-cols-2 gap-6">
                {camaradas.map(c => (
                  <div key={c.id} className="border-2 border-foreground p-4 relative group hover:bg-primary/5 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="text-2xl font-black uppercase leading-none mb-1">{c.nome}</h4>
                        <p className="text-xs font-bold uppercase italic opacity-70 flex items-center gap-1"><GraduationCap size={12}/> {c.curso}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 w-8 rounded-none border-2 border-transparent hover:border-foreground opacity-0 group-hover:opacity-100 transition-all font-black text-xs" onClick={() => deleteCamarada(c.id, c.nome)}>✕</Button>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-4">
                      {c.horarios_disponiveis?.map((h, i) => (
                        <span key={i} className="text-[9px] font-black uppercase bg-foreground text-background px-1.5 py-0.5">{labelDia[h.dia]} {labelTurno[h.turno].charAt(0)}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTurn>
  );
};

export default CamaradasSection;
