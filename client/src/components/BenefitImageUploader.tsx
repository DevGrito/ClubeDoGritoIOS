import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Link, X, Image } from "lucide-react";

interface BenefitImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  className?: string;
  label?: string;
}

export function BenefitImageUploader({ 
  value, 
  onChange, 
  className = "",
  label = "Imagem do Benefício"
}: BenefitImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>(
    value?.startsWith("http") ? value : ""
  );
  const [urlInput, setUrlInput] = useState(value || "");
  const { toast } = useToast();
  
  // Gerar ID único baseado no label
  const uniqueId = `image-upload-${label.toLowerCase().replace(/\s+/g, '-')}`;

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validações
    if (!file.type.startsWith('image/')) {
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

      // Criar preview local imediatamente
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);

      console.log('🔄 [BENEFIT IMAGE] Iniciando upload de imagem de benefício');

      // Criar FormData para upload
      const formData = new FormData();
      formData.append('image', file);

      // Upload da imagem
      const response = await fetch('/api/beneficios/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erro no upload da imagem');
      }

        const result = await response.json();

        // aceita tanto o contrato novo quanto o legado
        const objectPath: string | undefined = result.objectPath ?? result.imageUrl;
        const signedPreview: string | undefined = result.previewUrl;

        console.log('✅ [BENEFIT IMAGE] Upload concluído:', objectPath);

        if (!objectPath) {
          throw new Error('Resposta sem caminho da imagem (objectPath/imageUrl).');
        }

        // Preview: usa a signed URL se veio; senão mantém o local até fechar o modal
        if (signedPreview) {
          setPreviewUrl(signedPreview);
        }

        // No form, guardamos a **chave** (para enviar no POST /api/beneficios)
        setUrlInput(objectPath);
        onChange(objectPath);
      // Limpar preview local
      URL.revokeObjectURL(localPreview);
      
      toast({
        title: "Sucesso!",
        description: "Imagem carregada com sucesso.",
      });

    } catch (error: any) {
      console.error('❌ [BENEFIT IMAGE] Erro no upload:', error);
      
      // Restaurar imagem anterior em caso de erro
      setPreviewUrl(value || "");
      
      toast({
        title: "Erro no upload",
        description: error.message || "Não foi possível carregar a imagem.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlChange = (url: string) => {
    setUrlInput(url);
    setPreviewUrl(url);
    onChange(url);
  };

  const clearImage = () => {
    setPreviewUrl("");
    setUrlInput("");
    onChange("");
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">📁 Upload do PC</TabsTrigger>
          <TabsTrigger value="url">🔗 URL da Web</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
              className="hidden"
              id={uniqueId}
              disabled={isUploading}
            />
            
            <label 
              htmlFor={uniqueId}
              className="cursor-pointer flex flex-col items-center space-y-2"
            >
              {isUploading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span>Carregando...</span>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Clique para selecionar uma imagem
                  </span>
                  <span className="text-xs text-gray-400">
                    PNG, JPG ou WEBP até 5MB
                  </span>
                </>
              )}
            </label>
          </div>
        </TabsContent>
        
        <TabsContent value="url" className="space-y-4">
          <div className="flex space-x-2">
            <Input 
              placeholder="Ex: https://exemplo.com/imagem.jpg" 
              value={urlInput}
              onChange={(e) => handleUrlChange(e.target.value)}
              className="flex-1"
            />
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => handleUrlChange(urlInput)}
            >
              <Link className="h-4 w-4" />
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Preview da imagem */}
      {previewUrl && (
        <div className="relative">
          <img 
            src={previewUrl} 
            alt="Preview" 
            className="w-full h-48 object-cover rounded-lg border"
            onError={() => {
              setPreviewUrl("");
              toast({
                title: "Erro na imagem",
                description: "Não foi possível carregar a imagem.",
                variant: "destructive"
              });
            }}
          />
          <Button
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={clearImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}