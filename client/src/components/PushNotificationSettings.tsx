import { useEffect, useId } from "react";
import { Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { usePushNotificationsContext } from "@/contexts/PushNotificationsContext";
import { iosPushNeedsHomeScreen } from "@/utils/device";

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
        className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-200"
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
      <div className={className}>
        {row}
        {lgpdNote}
      </div>
    );
  }

  if (variant === "panel") {
    return (
      <div className={`border rounded-lg p-4 bg-white ${className}`}>
        <h3 className="font-semibold mb-3 text-gray-900">Notificações push</h3>
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
        {row}
        {lgpdNote}
      </CardContent>
    </Card>
  );
}
