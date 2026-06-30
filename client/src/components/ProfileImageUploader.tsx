import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useProfileImage } from "@/hooks/useProfileImage";
import { apiRequest } from "@/lib/queryClient";
import { Camera, Upload, X } from "lucide-react";

interface ProfileImageUploaderProps {
  userId: number;
  currentImage?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
  onUploadSuccess?: () => void;
}

export function ProfileImageUploader({
  userId,
  currentImage,
  size = "md",
  className = "",
  onUploadSuccess
}: ProfileImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null);
  const { updateProfileImage } = useProfileImage();
  const { toast } = useToast();

  // Tamanhos do componente
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32"
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    // Validações
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Formato inválido",
        description: "Por favor, selecione apenas arquivos de imagem.",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      toast({
        title: "Arquivo muito grande",
        description: "A imagem deve ter no máximo 5MB.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsUploading(true);

      // Preview local imediato
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);

      console.log("🔄 [PROFILE IMAGE] Iniciando upload para usuário", userId);

      const formData = new FormData();
      formData.append("file", file);

      console.log("🔄 [PROFILE IMAGE] Fazendo upload via FormData");

      const response = await fetch("/api/profile/upload-file", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      // Lê o JSON apenas UMA vez
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Erro no upload: ${response.status}`);
      }

      const finalImageUrl = result.imageUrl;
      console.log("✅ [PROFILE IMAGE] Upload concluído:", finalImageUrl);

      // Usa a URL real do servidor no preview
      setPreviewUrl(finalImageUrl);

      // Salvar referência no banco de dados
      await apiRequest(`/api/users/${userId}/profile-image`, {
        method: "PUT",
        body: JSON.stringify({ imageUrl: finalImageUrl }),
        headers: {
          "Content-Type": "application/json"
        }
      });

      console.log("✅ [PROFILE IMAGE] Foto salva no banco de dados");

      // Atualiza contexto/global
      updateProfileImage();

      // Libera o blob local
      URL.revokeObjectURL(localPreview);

      toast({
        title: "Sucesso!",
        description: "Foto de perfil atualizada com sucesso.",
      });

      // Callback opcional
      if (onUploadSuccess) {
        setTimeout(() => {
          onUploadSuccess();
        }, 500);
      }

    } catch (error: any) {
      console.error("❌ [PROFILE IMAGE] Erro no upload:", error);

      // Restaurar imagem anterior em caso de erro
      setPreviewUrl(currentImage || null);

      toast({
        title: "Erro no upload",
        description: error.message || "Não foi possível atualizar a foto de perfil.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleRemoveImage = async () => {
    try {
      setIsUploading(true);

      // Remover do banco
      await apiRequest(`/api/users/${userId}/profile-image`, {
        method: "PUT",
        body: JSON.stringify({ imageUrl: null }),
        headers: {
          "Content-Type": "application/json"
        }
      });

      // Forçar atualização da imagem
      updateProfileImage();
      setPreviewUrl(null);

      toast({
        title: "Foto removida",
        description: "Foto de perfil removida com sucesso.",
      });
    } catch (error) {
      console.error("❌ Erro ao remover foto:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a foto de perfil.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className={`${sizeClasses[size]} rounded-full border-2 border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center relative group cursor-pointer`}>
        {/* Imagem ou placeholder */}
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Foto de perfil"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-red-500 flex items-center justify-center text-white font-bold text-lg">
            <Camera className="w-8 h-8" />
          </div>
        )}

        {/* Overlay de upload */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
          {isUploading ? (
            <div className="text-white">
              <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Upload className="w-6 h-6 text-white" />
            </div>
          )}
        </div>

        {/* Input file invisível */}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={isUploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>

      {/* Botão de remoção */}
      {previewUrl && !isUploading && (
        <button
          onClick={handleRemoveImage}
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg"
          title="Remover foto"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
