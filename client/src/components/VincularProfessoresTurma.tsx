import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GraduationCap, Users, Loader2, Palette, BookOpen, Music, Paintbrush, Dumbbell, Code, Star, Heart, Lightbulb, Trophy, Mic, Camera, Pencil } from "lucide-react";

const CORES_DISPONIVEIS = [
  { value: '#3B82F6', label: 'Azul', bg: 'bg-blue-500' },
  { value: '#8B5CF6', label: 'Roxo', bg: 'bg-purple-500' },
  { value: '#EC4899', label: 'Rosa', bg: 'bg-pink-500' },
  { value: '#10B981', label: 'Verde', bg: 'bg-emerald-500' },
  { value: '#F59E0B', label: 'Amarelo', bg: 'bg-amber-500' },
  { value: '#EF4444', label: 'Vermelho', bg: 'bg-red-500' },
  { value: '#06B6D4', label: 'Ciano', bg: 'bg-cyan-500' },
  { value: '#F97316', label: 'Laranja', bg: 'bg-orange-500' },
  { value: '#6366F1', label: 'Indigo', bg: 'bg-indigo-500' },
  { value: '#14B8A6', label: 'Teal', bg: 'bg-teal-500' },
];

const ICONES_DISPONIVEIS = [
  { value: 'book', label: 'Livro', icon: BookOpen },
  { value: 'music', label: 'Música', icon: Music },
  { value: 'art', label: 'Arte', icon: Paintbrush },
  { value: 'sport', label: 'Esporte', icon: Dumbbell },
  { value: 'code', label: 'Tecnologia', icon: Code },
  { value: 'star', label: 'Estrela', icon: Star },
  { value: 'heart', label: 'Social', icon: Heart },
  { value: 'idea', label: 'Inovação', icon: Lightbulb },
  { value: 'trophy', label: 'Troféu', icon: Trophy },
  { value: 'mic', label: 'Comunicação', icon: Mic },
  { value: 'camera', label: 'Mídia', icon: Camera },
  { value: 'pencil', label: 'Escrita', icon: Pencil },
];

export { CORES_DISPONIVEIS, ICONES_DISPONIVEIS };

interface ProfessorSelection {
  id: number;
  cor: string;
  icone: string;
}

interface VincularProfessoresTurmaProps {
  turmaId: number;
  turmaTipo: 'pec' | 'inclusao';
  programa: 'pec' | 'inclusao_produtiva';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  turmaNome?: string;
}

export default function VincularProfessoresTurma({ turmaId, turmaTipo, programa, open, onOpenChange, turmaNome }: VincularProfessoresTurmaProps) {
  const { toast } = useToast();
  const [selections, setSelections] = useState<ProfessorSelection[]>([]);

  const { data: professores = [], isLoading: loadingProfs } = useQuery({
    queryKey: ['/api/coordenador/professores', programa],
    queryFn: async () => {
      const response = await fetch(`/api/coordenador/professores?programa=${programa}`);
      if (!response.ok) throw new Error('Falha');
      return response.json();
    },
    enabled: open,
  });

  const { data: vinculados = [], isLoading: loadingVinc } = useQuery({
    queryKey: ['/api/coordenador/professor-turmas', turmaId, turmaTipo],
    queryFn: async () => {
      const response = await fetch(`/api/coordenador/professor-turmas/${turmaId}?tipo=${turmaTipo}`);
      if (!response.ok) throw new Error('Falha');
      return response.json();
    },
    enabled: open,
  });

  useEffect(() => {
    if (vinculados.length > 0) {
      setSelections(vinculados.map((v: any) => ({
        id: v.professor_id,
        cor: v.cor || '#3B82F6',
        icone: v.icone || 'book'
      })));
    } else {
      setSelections([]);
    }
  }, [vinculados]);

  const salvarMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/coordenador/professor-turmas/${turmaId}`, {
        method: 'PUT',
        body: JSON.stringify({
          professores: selections.map(s => ({ id: s.id, cor: s.cor, icone: s.icone })),
          turmaTipo
        })
      });
    },
    onSuccess: () => {
      toast({ title: "Professores vinculados com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ['/api/coordenador/professor-turmas', turmaId, turmaTipo] });
      queryClient.invalidateQueries({ queryKey: ['/api/coordenador/professores', programa] });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Erro ao vincular professores", variant: "destructive" });
    }
  });

  const profsAtivos = professores.filter((p: any) => p.ativo);
  const isLoading = loadingProfs || loadingVinc;

  const isSelected = (profId: number) => selections.some(s => s.id === profId);

  const toggleProfessor = (profId: number) => {
    if (isSelected(profId)) {
      setSelections(prev => prev.filter(s => s.id !== profId));
    } else {
      setSelections(prev => [...prev, { id: profId, cor: '#3B82F6', icone: 'book' }]);
    }
  };

  const updateSelection = (profId: number, field: 'cor' | 'icone', value: string) => {
    setSelections(prev => prev.map(s => s.id === profId ? { ...s, [field]: value } : s));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-500" />
            Vincular Professores {turmaNome ? `- ${turmaNome}` : ''}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : profsAtivos.length === 0 ? (
            <p className="text-center text-gray-500 py-4">
              Nenhum professor cadastrado. Cadastre professores primeiro na aba "Gerenciar Professores".
            </p>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {profsAtivos.map((prof: any) => {
                const selected = isSelected(prof.id);
                const sel = selections.find(s => s.id === prof.id);
                return (
                  <div key={prof.id} className={`border rounded-lg transition-colors ${selected ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'}`}>
                    <label className="flex items-center gap-3 p-3 cursor-pointer">
                      <Checkbox
                        checked={selected}
                        onCheckedChange={() => toggleProfessor(prof.id)}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{prof.nome}</p>
                        <p className="text-xs text-gray-500">{prof.email}</p>
                      </div>
                      {selected && (
                        <Badge className="bg-blue-100 text-blue-800 text-xs">Vinculado</Badge>
                      )}
                    </label>
                    {selected && sel && (
                      <div className="px-3 pb-3 space-y-2 border-t pt-2 ml-9">
                        <div>
                          <p className="text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
                            <Palette className="w-3 h-3" /> Cor do marcador
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {CORES_DISPONIVEIS.map(c => (
                              <button
                                key={c.value}
                                type="button"
                                onClick={() => updateSelection(prof.id, 'cor', c.value)}
                                className={`w-6 h-6 rounded-full transition-all ${c.bg} ${sel.cor === c.value ? 'ring-2 ring-offset-1 ring-gray-800 scale-110' : 'opacity-70 hover:opacity-100'}`}
                                title={c.label}
                              />
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-600 mb-1.5">Ícone</p>
                          <div className="flex flex-wrap gap-1.5">
                            {ICONES_DISPONIVEIS.map(ic => {
                              const IconComp = ic.icon;
                              return (
                                <button
                                  key={ic.value}
                                  type="button"
                                  onClick={() => updateSelection(prof.id, 'icone', ic.value)}
                                  className={`w-7 h-7 rounded-md flex items-center justify-center transition-all border ${sel.icone === ic.value ? 'border-blue-500 bg-blue-100 text-blue-700 scale-110' : 'border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                                  title={ic.label}
                                >
                                  <IconComp className="w-3.5 h-3.5" />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm text-gray-500">
              {selections.length} professor(es) selecionado(s)
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button
                className="bg-blue-500 hover:bg-blue-600"
                disabled={salvarMutation.isPending}
                onClick={() => salvarMutation.mutate()}
              >
                {salvarMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
