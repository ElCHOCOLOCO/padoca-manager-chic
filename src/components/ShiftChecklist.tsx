import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

const ShiftChecklist = ({ 
  items, 
  onToggle, 
  onRemove,
  onComplete 
}: { 
  items: ChecklistItem[]; 
  onToggle: (id: string) => void;
  onRemove?: (id: string) => void;
  onComplete: () => void;
}) => {
  const allChecked = items.length > 0 && items.every(item => item.checked);

  return (
    <Card className="border-4 border-foreground rounded-none bg-background shadow-none animate-in slide-in-from-top duration-500">
      <CardHeader className="bg-foreground text-background py-4">
        <CardTitle className="text-2xl font-black uppercase italic">Protocolo de Operação</CardTitle>
      </CardHeader>
      <CardContent className="pt-8 space-y-4">
        {items.map(item => (
          <div key={item.id} className="flex items-center justify-between gap-3 p-3 border-2 border-foreground hover:bg-muted/30 transition-colors group">
            <div className="flex items-center gap-3">
              <Checkbox 
                id={item.id} 
                checked={item.checked} 
                onCheckedChange={() => onToggle(item.id)} 
                className="border-2 border-foreground h-6 w-6 rounded-none data-[state=checked]:bg-foreground data-[state=checked]:text-background"
              />
              <Label htmlFor={item.id} className="text-xl font-bold italic cursor-pointer">{item.label}</Label>
            </div>
            {onRemove && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0 rounded-none border-2 border-foreground hover:bg-red-600 hover:text-white"
                onClick={() => onRemove(item.id)}
              >
                ✕
              </Button>
            )}
          </div>
        ))}

        {items.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-foreground/30">
            <p className="text-sm font-black uppercase opacity-60">Nenhuma demanda cadastrada no protocolo.</p>
          </div>
        )}

        <Button 
          className="w-full h-16 mt-6 font-black uppercase text-xl italic rounded-none border-4 border-foreground bg-foreground text-background hover:bg-background hover:text-foreground transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none"
          disabled={!allChecked}
          onClick={onComplete}
        >
          {allChecked ? "Certificar e Iniciar Turno" : "Aguardando Verificação Total"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ShiftChecklist;
