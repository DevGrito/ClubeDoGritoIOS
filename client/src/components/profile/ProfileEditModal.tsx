import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProfileEditForm } from "./ProfileEditForm";
import { ProfileImageUploader } from "@/components/ProfileImageUploader";
import { CompanyAvatar } from "@/components/CompanyAvatar";

interface ProfileEditModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  userId?: number;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  isCompany?: boolean;
  onClose?: () => void;
}

export function ProfileEditModal({ 
  open, 
  onOpenChange, 
  userId,
  userName,
  userEmail,
  userPhone,
  isCompany = false,
  onClose
}: ProfileEditModalProps) {
  const handleSuccess = () => {
    if (onOpenChange) {
      onOpenChange(false);
    }
    if (onClose) {
      onClose();
    }
  };

  const handleCancel = () => {
    if (onOpenChange) {
      onOpenChange(false);
    }
    if (onClose) {
      onClose();
    }
  };

  // Se for empresa (patrocinador), mostrar apenas uploader de logo
  if (isCompany && userId && userName) {
    return (
      <Dialog open={open !== undefined ? open : true} onOpenChange={onOpenChange || ((isOpen) => !isOpen && onClose?.())}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Logo da Empresa</DialogTitle>
            <DialogDescription>
              Atualize o logo da sua empresa.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center space-y-6 py-4">
            <CompanyAvatar
              size="xl"
              companyName={userName}
              clickable={false}
            />
            
            <ProfileImageUploader
              userId={userId}
              size="lg"
              onUploadSuccess={handleSuccess}
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Modo normal para usuários
  return (
    <Dialog open={open !== undefined ? open : true} onOpenChange={onOpenChange || ((isOpen) => !isOpen && onClose?.())}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Dados Cadastrais</DialogTitle>
          <DialogDescription>
            Atualize suas informações pessoais abaixo.
          </DialogDescription>
        </DialogHeader>
        <ProfileEditForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </DialogContent>
    </Dialog>
  );
}
