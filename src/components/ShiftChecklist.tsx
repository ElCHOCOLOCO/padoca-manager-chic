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

const ShiftChecklist = ({ onComplete }: { onComplete: () => void }) => {
  const [items, setItems] = useState<ChecklistItem[]>([
    { id: '1', label: 'Conferência de fundo de caixa', checked: false },
    { id: '2', label: 'Verificação de validade dos insumos', checked: false },
    { id: '3', label: 'Organização da área de vendas', checked: false },
    { id: '4', label: 'Estoque de embalagens ok', checked: false },
  ]);

  const toggleItem = (id: string) => {
    setItems(items.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const allChecked = items.every(item => item.checked);

  return (
    <Card className="border-2 border-foreground ink-shadow animate-in slide-in-from-top duration-500">
      <CardHeader className="bg-primary text-primary-foreground">
        <CardTitle className="font-serif">Protocolo de Abertura de Turno</CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-3 p-2 hover:bg-muted transition-colors">
            <Checkbox 
              id={item.id} 
              checked={item.checked} 
              onCheckedChange={() => toggleItem(item.id)} 
              className="border-foreground"
            />
            <Label htmlFor={item.id} className="text-lg cursor-pointer">{item.label}</Label>
          </div>
        ))}
        <Button 
          className="w-full mt-4 font-bold uppercase tracking-widest rounded-none border-2 border-foreground"
          disabled={!allChecked}
          onClick={onComplete}
        >
          Iniciar Turno Oficialmente
        </Button>
      </CardContent>
    </Card>
  );
};

export default ShiftChecklist;
