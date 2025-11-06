import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit, Save, X, Camera, User } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useProfileImage } from "@/hooks/useProfileImage";
import { useUserData } from "@/hooks/useUserData";
import { ProfileImageUploader } from "@/components/ProfileImageUploader";

export default function DadosCadastrais() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    sobrenome: "",
    email: "",
    telefone: "",
    plano: "",
    nomeEmpresa: "",
    nomeResponsavel: "",
  });
  const { profileImage } = useProfileImage();
  const { userData, updateUserData } = useUserData();

  // Detectar se o usuário é patrocinador
  const userPapel = localStorage.getItem("userPapel") || "";
  const isPatrocinador = userPapel === "patrocinador";

  // TRECHO ADICIONADO
  useEffect(() => {
    if (!userData || isEditing) return;

    setFormData({
      nome: userData?.nome ?? "",
      sobrenome: userData?.sobrenome ?? "",
      email: userData?.email ?? "",
      telefone: userData?.telefone ?? "",
      plano: userData?.plano ?? "",
      // mapeia empresa/responsável apenas se existirem (ou cai no nome/sobrenome)
      nomeEmpresa: userData?.nomeEmpresa ?? userData?.nome ?? "",
      nomeResponsavel: userData?.nomeResponsavel ?? userData?.sobrenome ?? "",
    });
  }, [userData, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getInitials = (nome: string, sobrenome: string) => {
    return `${nome.charAt(0)}${sobrenome.charAt(0)}`.toUpperCase();
  };

  const handleSave = async () => {
    try {
      // Update global user data
      const payload = isPatrocinador
        ? {
            nomeEmpresa: formData.nomeEmpresa ?? "",
            nomeResponsavel: formData.nomeResponsavel ?? "",
          }
        : {
            nome: formData.nome ?? "",
            sobrenome: formData.sobrenome ?? "",
            email: formData.email ?? "",
            telefone: formData.telefone ?? "",
          };

      await updateUserData(payload);

      setIsEditing(false);
      toast({
        title: "Dados atualizados",
        description: "Suas informações foram salvas com sucesso",
      });
    } catch (error) {
      console.error("Error saving user data:", error);
      toast({
        title: "Erro ao salvar",
        description:
          "Não foi possível atualizar suas informações. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const planNames = {
    eco: "Eco - R$ 9,90/mês",
    voz: "Voz - R$ 19,90/mês",
    grito: "O Grito - R$ 29,90/mês",
    platinum: "Platinum - Personalizado",
    diamante: "Diamante - Personalizado",
  };
    // 2) ref do primeiro input (uma única vez)
    const firstInputRef = useRef<HTMLInputElement>(null);

    // 3) plano atual com fallback
    const planoAtual = ((formData.plano ?? userData?.plano) ?? "") as keyof typeof planNames;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setLocation(isPatrocinador ? "/perfil-patrocinador" : "/perfil")
              }
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold text-black">Dados Cadastrais</h1>
          </div>
          <Button
              variant="ghost"
              size="sm"
            onClick={() => {
              setIsEditing((prev) => !prev);
              setTimeout(() => firstInputRef.current?.focus(), 0);
            }}
            className="p-2"
            >
            {isEditing ? <X className="w-5 h-5" /> : <Edit className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-md mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {isPatrocinador ? "Dados da Empresa" : "Informações Pessoais"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Profile Image Section */}
            <div className="flex flex-col items-center space-y-4">
              <div
                onClick={() => setIsEditing(true)}
                className="cursor-pointer"
              >
                <ProfileImageUploader
                  userId={parseInt(localStorage.getItem("userId") || "0")}
                  currentImage={profileImage}
                  size="md"
                />
              </div>
              <p className="text-sm text-gray-600 text-center">
                Clique na imagem para editar seu perfil
              </p>
            </div>

            {isPatrocinador ? (
              <>
                <div>
                  <Label htmlFor="nomeEmpresa">Nome da Empresa</Label>
                  <Input
                    id="nomeEmpresa"
                    name="nomeEmpresa"
                    value={formData.nomeEmpresa ?? ""}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="nomeResponsavel">Nome do Responsável</Label>
                  <Input
                    id="nomeResponsavel"
                    name="nomeResponsavel"
                    value={formData.nomeResponsavel ?? ""}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="mt-1"
                  />
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    ref={firstInputRef}
                    id="nome"
                    name="nome"
                    value={formData.nome ?? ""}   // ✅ nunca undefined
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="sobrenome">Sobrenome</Label>
                  <Input
                    id="sobrenome"
                    name="sobrenome"
                    value={formData.sobrenome  ?? ""}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email ?? ""}
                onChange={handleChange}
                disabled={!isEditing}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                name="telefone"
                value={formData.telefone ?? ""}
                onChange={handleChange}
                disabled={!isEditing}
                className="mt-1"
              />
            </div>

            {!isPatrocinador && (
              <div>
                <Label htmlFor="plano">Plano Atual</Label>
                <Input
                  id="plano"
                  value={planNames[planoAtual] ?? (formData.plano ?? "")}
                  disabled
                  className="mt-1 bg-gray-100"
                />
              </div>
            )}

            {isEditing && (
              <Button
                onClick={handleSave}
                className="w-full bg-gradient-to-r from-yellow-400 to-red-500 hover:from-yellow-500 hover:to-red-600 text-black font-semibold"
              >
                <Save className="w-4 h-4 mr-2" />
                Salvar Alterações
              </Button>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
