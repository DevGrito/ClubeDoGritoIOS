import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Upload, Image as ImageIcon, X } from "lucide-react";

interface ImageUploaderProps {
  label: string;
  value?: string;
  onChange: (url: string) => void;
  size: string;
  required?: boolean;
}

// Função para comprimir imagens automaticamente
function compressAndConvert(file: File, callback: (base64: string) => void) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();
  
  img.onload = () => {
    // Definir tamanho máximo baseado no tipo de imagem
    let maxWidth = 800;
    let maxHeight = 600;
    
    // Para stories (imagens altas), permitir maior altura
    if (img.height > img.width * 1.5) {
      maxWidth = 600;
      maxHeight = 1200;
    }
    
    // Calcular novo tamanho mantendo proporção
    let { width, height } = img;
    if (width > maxWidth || height > maxHeight) {
      const aspectRatio = width / height;
      if (width > height) {
        width = maxWidth;
        height = width / aspectRatio;
      } else {
        height = maxHeight;
        width = height * aspectRatio;
      }
    }
    
    // Aplicar o tamanho no canvas
    canvas.width = width;
    canvas.height = height;
    
    // Desenhar a imagem redimensionada
    ctx?.drawImage(img, 0, 0, width, height);
    
    // Converter para base64 com qualidade reduzida
    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
    callback(compressedBase64);
  };
  
  // Carregar a imagem
  const reader = new FileReader();
  reader.onload = (e) => {
    img.src = e.target?.result as string;
  };
  reader.readAsDataURL(file);
}

export function ImageUploader({ label, value, onChange, size, required = false }: ImageUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string>(value || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validações básicas
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem (PNG, JPG, JPEG, etc.)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('O arquivo deve ter no máximo 5MB');
      return;
    }

    // Comprimir e converter imagem para base64
    compressAndConvert(file, (compressedBase64) => {
      setPreviewUrl(compressedBase64);
      onChange(compressedBase64);
    });
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    setPreviewUrl('');
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <ImageIcon className="w-4 h-4" />
        {label} {required && <span className="text-red-500">*</span>}
        <span className="text-sm text-gray-500">({size})</span>
      </Label>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors">
        {previewUrl ? (
          <div className="relative">
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="max-w-full max-h-32 object-contain rounded"
            />
            <button
              type="button"
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              onClick={handleRemove}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="text-center cursor-pointer" onClick={handleClick}>
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-2">
              <span className="text-sm text-gray-600">
                Clique para selecionar uma imagem
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG, JPEG até 5MB
            </p>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleFileSelect}
      />
    </div>
  );
}