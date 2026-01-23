import { useState, useEffect } from "react";
import { Bell, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  isNotificationsSupported,
  getNotificationPermission,
  registerForPushNotifications,
  saveTokenLocally,
} from "@/lib/pushNotifications";

interface NotificationPermissionPromptProps {
  userId?: number;
  onPermissionGranted?: () => void;
  onDismiss?: () => void;
}

export function NotificationPermissionPrompt({
  userId,
  onPermissionGranted,
  onDismiss,
}: NotificationPermissionPromptProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Verificar se deve mostrar o prompt
    const checkPermission = () => {
      if (!isNotificationsSupported()) {
        console.log("[NOTIF PROMPT] Navegador não suporta notificações");
        return;
      }

      const permission = getNotificationPermission();
      const dismissed = localStorage.getItem("notification_prompt_dismissed");
      const dismissedAt = localStorage.getItem("notification_prompt_dismissed_at");

      // Se já tem permissão, não mostrar
      if (permission === "granted") {
        console.log("[NOTIF PROMPT] Permissão já concedida");
        return;
      }

      // Se foi negado permanentemente, não mostrar
      if (permission === "denied") {
        console.log("[NOTIF PROMPT] Permissão negada permanentemente");
        return;
      }

      // Se foi dispensado recentemente (menos de 7 dias), não mostrar
      if (dismissed === "true" && dismissedAt) {
        const dismissedDate = new Date(dismissedAt);
        const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceDismissed < 7) {
          console.log(`[NOTIF PROMPT] Dispensado há ${daysSinceDismissed.toFixed(1)} dias`);
          return;
        }
      }

      // Mostrar prompt após 3 segundos
      setTimeout(() => {
        setIsVisible(true);
      }, 3000);
    };

    checkPermission();
  }, []);

  const handleEnableNotifications = async () => {
    setIsLoading(true);

    try {
      // Verificar se notificações estão bloqueadas
      const currentPermission = getNotificationPermission();
      if (currentPermission === "denied") {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const description = isMobile
          ? "Vá em Configurações do navegador > Sites > Notificações e permita para este site."
          : "Clique no cadeado ao lado da URL e permita notificações nas configurações do site.";
        
        toast({
          title: "Notificações bloqueadas",
          description,
          variant: "destructive",
          duration: 8000,
        });
        setIsLoading(false);
        return;
      }

      const token = await registerForPushNotifications(userId);

      if (token) {
        saveTokenLocally(token);
        toast({
          title: "Notificações ativadas!",
          description: "Você receberá atualizações importantes do Clube do Grito.",
          duration: 5000,
        });
        setIsVisible(false);
        onPermissionGranted?.();
      } else {
        // Verificar novamente se foi negado após tentativa
        const permissionAfter = getNotificationPermission();
        if (permissionAfter === "denied") {
          const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
          const description = isMobile
            ? "Vá em Configurações do navegador > Sites > Notificações e permita para este site."
            : "Clique no cadeado ao lado da URL e permita notificações nas configurações do site.";
          
          toast({
            title: "Notificações bloqueadas",
            description,
            variant: "destructive",
            duration: 8000,
          });
        } else {
          toast({
            title: "Notificações não ativadas",
            description: "Verifique as configurações do seu navegador.",
            variant: "destructive",
            duration: 5000,
          });
        }
      }
    } catch (error) {
      console.error("[NOTIF PROMPT] Erro:", error);
      toast({
        title: "Erro ao ativar notificações",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("notification_prompt_dismissed", "true");
    localStorage.setItem("notification_prompt_dismissed_at", new Date().toISOString());
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96" data-testid="notification-prompt">
      <Card className="border-2 border-[#e4572e] shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-[#e4572e]/10 p-2">
                <Bell className="h-5 w-5 text-[#e4572e]" />
              </div>
              <CardTitle className="text-lg">Ativar Notificações</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleDismiss}
              data-testid="button-dismiss-notification-prompt"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="mb-4 text-gray-600">
            Receba atualizações sobre suas doações, novos eventos e conquistas no Clube do Grito.
          </CardDescription>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleDismiss}
              disabled={isLoading}
              data-testid="button-later-notification"
            >
              Depois
            </Button>
            <Button
              className="flex-1 bg-[#e4572e] hover:bg-[#c94526]"
              onClick={handleEnableNotifications}
              disabled={isLoading}
              data-testid="button-enable-notification"
            >
              {isLoading ? (
                "Ativando..."
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Ativar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
