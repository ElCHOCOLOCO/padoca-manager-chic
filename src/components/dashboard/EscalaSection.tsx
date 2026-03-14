import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { ArrowRight, Clock } from "lucide-react";
import PageTurn from "@/components/ui/PageTurn";
import { Instituto, EscalaItem } from "../../types/dashboard";
import { dias, labelDia, labelTurno, Turno } from "../../constants/dashboard";

interface EscalaSectionProps {
  institutos: Instituto[];
  escala: EscalaItem[];
  chartFilterType: 'global' | 'turno' | 'instituto';
  setChartFilterType: (val: 'global' | 'turno' | 'instituto') => void;
  selectedFilterId: string;
  setSelectedFilterId: (val: string) => void;
  setEscala: React.Dispatch<React.SetStateAction<EscalaItem[]>>;
  saveScaleAssignment: (instId: string, dia: string, turno: string, camId: string) => void;
  removeScaleAssignment: (id: string) => void;
  camaradas: { id: string, nome: string }[];
}

const EscalaSection: React.FC<EscalaSectionProps> = ({
  institutos,
  escala,
  chartFilterType,
  setChartFilterType,
  selectedFilterId,
  setSelectedFilterId,
  setEscala,
  saveScaleAssignment,
  removeScaleAssignment,
  camaradas
}) => {
  const demandStats = useMemo(() => {
    if (!institutos || !escala) return { totalSlots: 0, occupiedSlots: 0, gap: 0, occupancyRate: 0, breakdown: { manha: {total:0, occupied: 0}, tarde: {total:0, occupied: 0}, noite: {total:0, occupied: 0} } };

    const totalSlots = (institutos.length || 0) * 5 * 3; 
    const occupiedSlots = escala.length || 0;
    const gap = totalSlots - occupiedSlots;
    const occupancyRate = totalSlots > 0 ? (occupiedSlots / totalSlots) * 100 : 0;
    
    const breakdown = {
      manha: { total: (institutos.length || 0) * 5, occupied: escala.filter(e => e.turno === 'manha').length },
      tarde: { total: (institutos.length || 0) * 5, occupied: escala.filter(e => e.turno === 'tarde').length },
      noite: { total: (institutos.length || 0) * 5, occupied: escala.filter(e => e.turno === 'noite').length }
    };

    return { totalSlots, occupiedSlots, gap, occupancyRate, breakdown };
  }, [institutos, escala]);

  const chartData = useMemo(() => {
    if (!demandStats || !demandStats.breakdown) return [];

    if (chartFilterType === 'global') {
      return [
        { name: 'Manhã', Demanda: demandStats.breakdown.manha?.total || 0, Ocupado: demandStats.breakdown.manha?.occupied || 0 },
        { name: 'Tarde', Demanda: demandStats.breakdown.tarde?.total || 0, Ocupado: demandStats.breakdown.tarde?.occupied || 0 },
        { name: 'Noite', Demanda: demandStats.breakdown.noite?.total || 0, Ocupado: demandStats.breakdown.noite?.occupied || 0 },
      ];
    }

    if (chartFilterType === 'turno' && selectedFilterId) {
      const turno = selectedFilterId as Turno;
      return dias.map(d => ({
        name: labelDia[d],
        Demanda: institutos.length,
        Ocupado: escala.filter(e => e.dia === d && e.turno === turno).length
      }));
    }

    if (chartFilterType === 'instituto' && selectedFilterId) {
      const instId = selectedFilterId;
      return [
        { name: 'Manhã', Demanda: 5, Ocupado: escala.filter(e => e.instituto_id === instId && e.turno === 'manha').length },
        { name: 'Tarde', Demanda: 5, Ocupado: escala.filter(e => e.instituto_id === instId && e.turno === 'tarde').length },
        { name: 'Noite', Demanda: 5, Ocupado: escala.filter(e => e.instituto_id === instId && e.turno === 'noite').length },
      ];
    }

    return [];
  }, [demandStats, chartFilterType, selectedFilterId, institutos, escala]);

  return (
    <PageTurn pageKey="escala">
      <div className="space-y-12 animate-in fade-in zoom-in duration-700">
        <header className="flex flex-col md:flex-row justify-between items-end border-b-4 border-foreground pb-6">
          <div>
            <h2 className="text-6xl font-black uppercase tracking-tighter leading-none mb-2">Monitoramento de Turnos</h2>
            <p className="text-sm font-bold uppercase tracking-[0.3em] opacity-60">Logística de Alocação da Força de Trabalho</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-serif italic font-black">{demandStats.occupancyRate.toFixed(1)}%</div>
            <div className="text-[10px] font-black uppercase tracking-widest">Ocupação Global</div>
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 border-4 border-foreground rounded-none bg-background shadow-none">
            <CardHeader className="border-b-4 border-foreground flex flex-row items-center justify-between py-4 bg-muted/30">
              <CardTitle className="text-xl font-black uppercase italic">Equilíbrio de Demanda</CardTitle>
              <div className="flex gap-2">
                <Select value={chartFilterType} onValueChange={(v: any) => { setChartFilterType(v); setSelectedFilterId(""); }}>
                  <SelectTrigger className="w-[120px] h-8 rounded-none border-2 border-foreground text-[10px] font-black uppercase">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-2 border-foreground uppercase font-black text-[10px]">
                    <SelectItem value="global">Geral</SelectItem>
                    <SelectItem value="turno">Por Turno</SelectItem>
                    <SelectItem value="instituto">Por Instituto</SelectItem>
                  </SelectContent>
                </Select>

                {chartFilterType !== 'global' && (
                  <Select value={selectedFilterId} onValueChange={setSelectedFilterId}>
                    <SelectTrigger className="w-[150px] h-8 rounded-none border-2 border-foreground text-[10px] font-black uppercase">
                      <SelectValue placeholder="Selecionar..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-none border-2 border-foreground uppercase font-black text-[10px]">
                      {chartFilterType === 'turno' ? (
                        <>
                          <SelectItem value="manha">Manhã</SelectItem>
                          <SelectItem value="tarde">Tarde</SelectItem>
                          <SelectItem value="noite">Noite</SelectItem>
                        </>
                      ) : (
                        institutos.map(inst => (
                          <SelectItem key={inst.id} value={inst.id}>{inst.nome}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-8 h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" tick={{fontFamily: 'serif', fontWeight: 'bold', fontSize: 12}} axisLine={{strokeWidth: 2}} />
                  <YAxis tick={{fontFamily: 'serif', fontWeight: 'bold', fontSize: 12}} axisLine={{strokeWidth: 2}} />
                  <Tooltip 
                    contentStyle={{borderRadius: 0, border: '2px solid black', fontFamily: 'serif', fontWeight: 'bold'}}
                  />
                  <Legend wrapperStyle={{paddingTop: 20, fontFamily: 'serif', fontWeight: 'bold', textTransform: 'uppercase'}} />
                  <Bar dataKey="Demanda" fill="#111827" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Ocupado" fill="#FACC15" radius={[0, 0, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-4 border-foreground rounded-none bg-background shadow-none">
              <CardHeader className="bg-foreground text-background py-3">
                <CardTitle className="text-sm font-black uppercase text-center tracking-widest italic">Saúde de Cobertura</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {institutos.map(inst => {
                  const occupied = escala.filter(e => e.instituto_id === inst.id).length;
                  const total = 5 * 3; 
                  const perc = (occupied / total) * 100;
                  return (
                    <div key={inst.id} className="space-y-1">
                      <div className="flex justify-between text-[10px] font-black uppercase">
                        <span>{inst.nome}</span>
                        <span>{occupied}/{total}</span>
                      </div>
                      <div className="w-full h-4 border-2 border-foreground bg-muted p-[2px]">
                        <div 
                          className={cn("h-full transition-all duration-1000", perc < 50 ? "bg-red-600" : perc < 80 ? "bg-amber-500" : "bg-emerald-600")}
                          style={{ width: `${perc}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <div className="border-2 border-foreground p-4 bg-muted/20">
                <div className="text-3xl font-black font-serif italic leading-none">{demandStats.gap}</div>
                <div className="text-[10px] font-black uppercase opacity-60">Vagas Críticas</div>
              </div>
              <div className="border-2 border-foreground p-4 bg-foreground text-background">
                <div className="text-3xl font-black font-serif italic leading-none">{demandStats.occupiedSlots}</div>
                <div className="text-[10px] font-black uppercase opacity-60">Ativos Hoje</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {institutos.map(inst => (
            <Card key={inst.id} className="border-4 border-foreground rounded-none bg-background shadow-none flex flex-col">
              <CardHeader className="border-b-4 border-foreground py-4 bg-muted/10">
                <CardTitle className="text-3xl font-black uppercase tracking-tighter leading-none italic">{inst.nome}</CardTitle>
                <div className="text-xs font-bold uppercase opacity-60">{inst.turno}</div>
              </CardHeader>
              <CardContent className="pt-8 flex-1">
                <div className="space-y-6">
                  {dias.map(d => (
                    <div key={d} className="border-b-2 border-foreground/10 pb-4 last:border-0">
                      <h4 className="text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                        <ArrowRight size={14}/> {labelDia[d]}
                      </h4>
                      <div className="space-y-3">
                        {(['manha', 'tarde', 'noite'] as Turno[]).map(t => {
                          const assignment = escala.find(e => e.instituto_id === inst.id && e.dia === d && e.turno === t);
                          const assignedCamarada = camaradas.find(c => c.id === assignment?.camarada_id);
                          
                          return (
                            <div key={t} className="flex items-center gap-3">
                              <Badge variant="outline" className="rounded-none border-2 border-foreground font-black uppercase text-[9px] w-20 flex justify-center py-1">
                                {labelTurno[t]}
                              </Badge>
                              {assignment ? (
                                <div className="flex-1 flex items-center justify-between border-2 border-foreground px-3 py-1 bg-primary/5 group">
                                  <span className="text-sm font-black uppercase italic">{assignedCamarada?.nome || "Carregando..."}</span>
                                  <button onClick={() => removeScaleAssignment(assignment.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Clock size={14} className="text-red-600"/>
                                  </button>
                                </div>
                              ) : (
                                <select 
                                  className="flex-1 h-8 border-2 border-foreground bg-transparent rounded-none px-2 font-black uppercase text-[10px] italic focus:outline-none"
                                  onChange={(e) => saveScaleAssignment(inst.id, d, t, e.target.value)}
                                  value=""
                                >
                                  <option value="">Vacância...</option>
                                  {camaradas.map(c => (
                                    <option key={c.id} value={c.id}>{c.nome}</option>
                                  ))}
                                </select>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PageTurn>
  );
};

// Helper function for class merging (assuming it's available)
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export default EscalaSection;
