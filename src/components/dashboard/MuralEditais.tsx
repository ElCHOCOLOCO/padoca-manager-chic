import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Newspaper } from "lucide-react";

interface Edital {
  id: string;
  data: string;
  titulo: string;
  conteudo: string;
}

const MuralEditais = ({ editais }: { editais: Edital[] }) => {
  return (
    <Card className="border-4 border-foreground rounded-none bg-background shadow-none h-full">
      <CardHeader className="border-b-4 border-foreground bg-muted/50 py-3">
        <CardTitle className="text-xl font-black uppercase italic flex items-center gap-3">
          <Newspaper size={20} /> Mural de Editais
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[250px] w-full">
          <div className="divide-y-2 divide-foreground/20">
            {editais.length > 0 ? (
              editais.map((edital) => (
                <div key={edital.id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                      {edital.data}
                    </span>
                  </div>
                  <h4 className="text-lg font-black uppercase tracking-tight mb-2 leading-tight">
                    {edital.titulo}
                  </h4>
                  <p className="text-sm italic font-serif leading-relaxed opacity-90">
                    {edital.conteudo}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <p className="text-sm font-black uppercase italic opacity-40 typewriter mx-auto">
                  Aguardando ordens da produção...
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default MuralEditais;
