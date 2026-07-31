import { useEffect, useId } from "react";
import { Bell, Smartphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { usePushNotificationsContext } from "@/contexts/PushNotificationsContext";
import { iosPushNeedsHomeScreen, isIOS } from "@/utils/device";

export type PushNotificationSettingsProps = {
  variant?: "card" | "panel" | "inline";
  showLgpdNote?: boolean;
  className?: string;
  switchId?: string;
};

export function PushNotificationSettings({
  variant = "card",
  showLgpdNote = false,
  className = "",
  switchId,
}: PushNotificationSettingsProps) {
  const autoId = useId();
  const toggleId = switchId || `push-toggle-${autoId}`;
  const { toast } = useToast();
  const {
    userKey,
    pushEnabled,
    requestPermission,
    disablePush,
    refreshStatus,
    loading,
  } = usePushNotificationsContext();

  useEffect(() => {
    const sync = () => {
      void refreshStatus();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") sync();
    };
    window.addEventListener("push-state-changed", sync);
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("push-state-changed", sync);
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refreshStatus]);

  const handlePushToggle = async (enabled: boolean) => {
    if (!userKey) {
      toast({
        title: "Faça login",
        description: "Entre na sua conta para gerenciar notificações push.",
        variant: "destructive",
      });
      return;
    }
    if (enabled) {
      if (iosPushNeedsHomeScreen()) {
        toast({
          title: "Instale na Tela de Início",
          description: "No iPhone, adicione o app à Tela de Início e abra por lá para ativar notificações.",
          variant: "destructive",
        });
        return;
      }
      if (userKey) localStorage.removeItem(`push_dismissed_${userKey}`);
      await requestPermission();
    } else {
      await disablePush();
    }
  };

  const browserBlocked =
    typeof Notification !== "undefined" && Notification.permission === "denied";

  const statusText = browserBlocked
    ? "Bloqueadas pelo navegador — libere nas configurações do site"
    : pushEnabled
      ? "Ativas neste dispositivo"
      : "Desativadas no app (pode ativar novamente)";

  const iphoneNeedsHomeScreen = iosPushNeedsHomeScreen();
  const iphoneInstalledOnHomeScreen = isIOS() && !iphoneNeedsHomeScreen;

  const iphoneNotice = iphoneNeedsHomeScreen ? (
    <Alert className="border-amber-200 bg-amber-50 text-amber-950">
      <Smartphone className="h-4 w-4 text-amber-700" />
      <AlertTitle className="text-amber-950">iPhone: instale na Tela de Início</AlertTitle>
      <AlertDescription className="text-amber-900/90">
        <p className="mb-2">
          No iPhone, as notificações só funcionam com o app instalado na Tela de Início — não pelo Safari em aba normal.
        </p>
        <ol className="list-decimal list-inside space-y-1 text-xs sm:text-sm">
          <li>Abra este site no <strong>Safari</strong></li>
          <li>Toque em <strong>Compartilhar</strong> (ícone com seta para cima)</li>
          <li>Escolha <strong>Adicionar à Tela de Início</strong></li>
          <li>Abra o app <strong>pelo ícone</strong> e ative as notificações aqui</li>
        </ol>
      </AlertDescription>
    </Alert>
  ) : iphoneInstalledOnHomeScreen ? (
    <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
      App instalado na Tela de Início — você pode ativar as notificações abaixo.
    </p>
  ) : null;

  const row = (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center space-x-3 min-w-0">
        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center shrink-0">
          <Bell className="w-5 h-5 text-yellow-700" />
        </div>
        <div className="min-w-0">
          <Label htmlFor={toggleId} className="font-medium text-gray-900">
            Notificações no navegador
          </Label>
          <p className="text-xs text-gray-500">{statusText}</p>
        </div>
      </div>
      <Switch
        id={toggleId}
        checked={pushEnabled}
        disabled={loading || browserBlocked}
        onCheckedChange={handlePushToggle}
        className="shrink-0 data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-200"
      />
    </div>
  );

  const lgpdNote = showLgpdNote ? (
    <p className="text-xs text-gray-400 mt-3">
      Comunicações também dependem do consentimento em Privacidade e cookies (LGPD).
    </p>
  ) : null;

  if (variant === "inline") {
    return (
      <div className={`space-y-3 ${className}`}>
        {iphoneNotice}
        {row}
        {lgpdNote}
      </div>
    );
  }

  if (variant === "panel") {
    return (
      <div className={`border rounded-lg p-4 bg-white space-y-3 ${className}`}>
        <h3 className="font-semibold text-gray-900">Notificações push</h3>
        {iphoneNotice}
        {row}
        {lgpdNote}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg text-black font-semibold">Notificações push</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {iphoneNotice}
        {row}
        {lgpdNote}
      </CardContent>
    </Card>
  );
}
