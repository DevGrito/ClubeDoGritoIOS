import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, User, GraduationCap, UserPlus, Briefcase, Star, Shield } from "lucide-react";

interface CreateUserModalProps {
  type: 'professor' | 'aluno' | 'colaborador' | 'patrocinador' | 'conselheiro';
  onSuccess?: () => void;
}

const userTypeConfig = {
  professor: {
    title: "Criar Professor",
    icon: GraduationCap,
    color: "bg-blue-500",
    fields: ["nome", "email", "telefone", "especialidade", "formacao", "experiencia"]
  },
  aluno: {
    title: "Criar Aluno",
    icon: UserPlus,
    color: "bg-green-500",
    fields: ["nome", "email", "telefone", "curso", "periodo", "observacoes"]
  },
  colaborador: {
    title: "Criar Colaborador",
    icon: Briefcase,
    color: "bg-purple-500",
    fields: ["nome", "email", "telefone", "cargo", "setor", "dataAdmissao"]
  },
  patrocinador: {
    title: "Criar Patrocinador",
    icon: Star,
    color: "bg-yellow-500",
    fields: ["nome", "email", "telefone", "empresa", "tipoPatrocinio", "valorContribuicao"]
  },
  conselheiro: {
    title: "Criar Conselheiro",
    icon: Shield,
    color: "bg-indigo-500",
    fields: ["nome", "email", "telefone", "area", "mandato", "biografia"]
  }
};

export default function CreateUserModal({ type, onSuccess }: CreateUserModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const config = userTypeConfig[type];
  const Icon = config.icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.email || !formData.telefone) {
      toast({
        title: "Erro",
        description: "Nome, email e telefone são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/admin/create-user", {
        tipo: type,
        ...formData
      });

      toast({
        title: "Usuário criado",
        description: `${config.title.split(' ')[1]} criado com sucesso!`,
      });

      setFormData({});
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar o usuário. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderField = (field: string) => {
    const fieldLabels: Record<string, string> = {
      nome: "Nome completo",
      email: "Email",
      telefone: "Telefone",
      especialidade: "Especialidade",
      formacao: "Formação",
      experiencia: "Experiência profissional",
      curso: "Curso",
      periodo: "Período",
      observacoes: "Observações",
      cargo: "Cargo",
      setor: "Setor",
      dataAdmissao: "Data de admissão",
      empresa: "Empresa",
      tipoPatrocinio: "Tipo de patrocínio",
      valorContribuicao: "Valor da contribuição",
      area: "Área de atuação",
      mandato: "Mandato",
      biografia: "Biografia"
    };

    const isTextarea = ["experiencia", "observacoes", "biografia"].includes(field);
    const isSelect = ["periodo", "tipoPatrocinio", "setor"].includes(field);
    const isDate = ["dataAdmissao"].includes(field);

    if (isTextarea) {
      return (
        <div key={field} className="space-y-2">
          <Label htmlFor={field}>{fieldLabels[field]}</Label>
          <Textarea
            id={field}
            value={formData[field] || ""}
            onChange={(e) => setFormData(prev => ({ ...prev, [field]: e.target.value }))}
            className="min-h-[80px]"
          />
        </div>
      );
    }

    if (isSelect) {
      const options = {
        periodo: ["1º Período", "2º Período", "3º Período", "4º Período", "5º Período", "6º Período", "7º Período", "8º Período"],
        tipoPatrocinio: ["Patrocínio Gold", "Patrocínio Silver", "Patrocínio Bronze", "Apoio Institucional"],
        setor: ["Administrativo", "Financeiro", "Marketing", "Tecnologia", "Recursos Humanos", "Operações"]
      };

      return (
        <div key={field} className="space-y-2">
          <Label htmlFor={field}>{fieldLabels[field]}</Label>
          <Select value={formData[field] || ""} onValueChange={(value) => setFormData(prev => ({ ...prev, [field]: value }))}>
            <SelectTrigger>
              <SelectValue placeholder={`Selecione ${fieldLabels[field].toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {options[field as keyof typeof options]?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    return (
      <div key={field} className="space-y-2">
        <Label htmlFor={field}>{fieldLabels[field]}</Label>
        <Input
          id={field}
          type={isDate ? "date" : field === "email" ? "email" : field === "telefone" ? "tel" : "text"}
          value={formData[field] || ""}
          onChange={(e) => setFormData(prev => ({ ...prev, [field]: e.target.value }))}
          placeholder={`Digite ${fieldLabels[field].toLowerCase()}`}
        />
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-yellow-400">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 ${config.color} rounded-lg flex items-center justify-center text-white`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-black text-sm">
                  {config.title}
                </h4>
                <p className="text-xs text-gray-600 mt-1">
                  Adicionar novo {type} ao sistema
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Icon className="w-5 h-5" />
            <span>{config.title}</span>
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {config.fields.map(renderField)}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? "Criando..." : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}