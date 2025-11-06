import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProfileImageUploader } from "@/components/ProfileImageUploader";
import { useProfileImage } from "@/hooks/useProfileImage";
import { useUserData } from "@/hooks/useUserData";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

interface ProfileEditFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProfileEditForm({ onSuccess, onCancel }: ProfileEditFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    nome: "",
    sobrenome: "",
    email: "",
    telefone: "",
    plano: ""
  });
  const { profileImage } = useProfileImage();
  const { userData, updateUserData } = useUserData();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFormData(userData);
  }, [userData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateUserData(formData);
      
      toast({
        title: "Dados atualizados",
        description: "Suas informações foram salvas com sucesso",
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error saving user data:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar suas informações. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Profile Image Section */}
      <div className="flex flex-col items-center space-y-4">
        <ProfileImageUploader 
          userId={parseInt(localStorage.getItem("userId") || "0")}
          currentImage={profileImage}
          size="md"
        />
        <p className="text-sm text-gray-600 text-center">
          Clique na imagem para alterar sua foto de perfil
        </p>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="nome">Nome</Label>
          <Input
            id="nome"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            data-testid="input-nome"
          />
        </div>

        <div>
          <Label htmlFor="sobrenome">Sobrenome</Label>
          <Input
            id="sobrenome"
            name="sobrenome"
            value={formData.sobrenome}
            onChange={handleChange}
            data-testid="input-sobrenome"
          />
        </div>

        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            data-testid="input-email"
          />
        </div>

        <div>
          <Label htmlFor="telefone">Telefone</Label>
          <Input
            id="telefone"
            name="telefone"
            value={formData.telefone}
            onChange={handleChange}
            data-testid="input-telefone"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4">
        {onCancel && (
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            disabled={isSaving}
            data-testid="button-cancel-edit"
          >
            Cancelar
          </Button>
        )}
        <Button
          onClick={handleSave}
          className="flex-1"
          disabled={isSaving}
          data-testid="button-save-profile"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </div>
  );
}
