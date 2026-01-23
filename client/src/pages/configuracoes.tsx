import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Moon, Sun, Bell, Shield, Smartphone, BellRing, Check, X } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/bottom-nav";
import {
  isNotificationsSupported,
  getNotificationPermission,
  registerForPushNotifications,
  saveTokenLocally,
} from "@/lib/pushNotifications";

export default function Configuracoes() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    darkMode: false,
    notifications: true,
    smsNotifications: true,
    emailNotifications: true,
  });
  const [pushPermission, setPushPermission] = useState<string>("default");
  const [isActivatingPush, setIsActivatingPush] = useState(false);

  useEffect(() => {
    const savedSettings = localStorage.getItem("appSettings");
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
    
    if (isNotificationsSupported()) {
      setPushPermission(getNotificationPermission());
    }
  }, []);

  const handleSettingChange = (key: string, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem("appSettings", JSON.stringify(newSettings));
    
    if (key === "darkMode") {
      document.documentElement.classList.toggle("dark", value);
    }
    
    toast({
      title: "Configuração atualizada",
      description: "Suas preferências foram salvas",
    });
  };

  const handleActivatePushNotifications = async () => {
    if (!isNotificationsSupported()) {
      toast({
        title: "Não suportado",
        description: "Seu navegador não suporta notificações push.",
        variant: "destructive",
      });
      return;
    }

    setIsActivatingPush(true);
    
    try {
      const userData = localStorage.getItem("userData");
      const userId = userData ? JSON.parse(userData).id : undefined;
      
      console.log("[CONFIG] Solicitando permissão de notificações...");
      const token = await registerForPushNotifications(userId);
      
      if (token) {
        saveTokenLocally(token);
        setPushPermission("granted");
        toast({
          title: "Notificações ativadas!",
          description: "Você receberá atualizações importantes do Clube do Grito.",
          duration: 5000,
        });
      } else {
        setPushPermission(getNotificationPermission());
        toast({
          title: "Notificações não ativadas",
          description: "Verifique as configurações do seu navegador.",
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("[CONFIG] Erro:", error);
      toast({
        title: "Erro ao ativar notificações",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsActivatingPush(false);
    }
  };

  const settingItems = [
    {
      icon: settings.darkMode ? Moon : Sun,
      title: "Modo Escuro",
      description: "Alterar tema da aplicação",
      key: "darkMode",
      value: settings.darkMode,
    },
    {
      icon: Bell,
      title: "Notificações",
      description: "Receber notificações do app",
      key: "notifications",
      value: settings.notifications,
    },
    {
      icon: Smartphone,
      title: "SMS",
      description: "Receber notificações por SMS",
      key: "smsNotifications",
      value: settings.smsNotifications,
    },
    {
      icon: Shield,
      title: "E-mail",
      description: "Receber notificações por e-mail",
      key: "emailNotifications",
      value: settings.emailNotifications,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-md mx-auto px-4 pt-12 pb-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/perfil")}
              className="p-2"
              data-testid="button-back-configuracoes"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold text-black">Configurações</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Push Notifications - Functional */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-black font-semibold">Notificações Push</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  pushPermission === "granted" ? "bg-green-100" : 
                  pushPermission === "denied" ? "bg-red-100" : "bg-yellow-100"
                }`}>
                  {pushPermission === "granted" ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : pushPermission === "denied" ? (
                    <X className="w-5 h-5 text-red-600" />
                  ) : (
                    <BellRing className="w-5 h-5 text-yellow-600" />
                  )}
                </div>
                <div>
                  <Label className="font-medium text-black">
                    {pushPermission === "granted" ? "Ativadas" : 
                     pushPermission === "denied" ? "Bloqueadas" : "Desativadas"}
                  </Label>
                  <p className="text-sm text-gray-500">
                    {pushPermission === "granted" 
                      ? "Você receberá notificações"
                      : pushPermission === "denied"
                      ? "Redefina nas configurações do navegador"
                      : "Clique para ativar"}
                  </p>
                </div>
              </div>
              
              {pushPermission !== "granted" && pushPermission !== "denied" && (
                <Button
                  onClick={handleActivatePushNotifications}
                  disabled={isActivatingPush}
                  className="bg-[#e4572e] hover:bg-[#c94526]"
                  data-testid="button-activate-push"
                >
                  {isActivatingPush ? "Ativando..." : "Ativar"}
                </Button>
              )}
              
              {pushPermission === "granted" && (
                <div className="text-green-600 font-medium text-sm flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  Ativo
                </div>
              )}
              
              {pushPermission === "denied" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    toast({
                      title: "Redefinir permissão",
                      description: "Clique no cadeado na barra de endereço do navegador e permita notificações.",
                      duration: 8000,
                    });
                  }}
                  data-testid="button-help-push"
                >
                  Ajuda
                </Button>
              )}
            </div>
            
            {!isNotificationsSupported() && (
              <p className="text-sm text-red-500">
                Seu navegador não suporta notificações push.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Appearance - Disabled */}
        <Card className="opacity-50">
          <CardHeader>
            <CardTitle className="text-lg text-black font-semibold">Aparência</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <Sun className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <Label htmlFor="darkMode" className="font-medium text-gray-400">
                    Modo Escuro
                  </Label>
                  <p className="text-sm text-gray-400">
                    Funcionalidade em desenvolvimento
                  </p>
                </div>
              </div>
              <Switch
                id="darkMode"
                checked={false}
                disabled={true}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications - Disabled */}
        <Card className="opacity-50">
          <CardHeader>
            <CardTitle className="text-lg text-black font-semibold">Outras Notificações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {settingItems.slice(1).map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <Label htmlFor={item.key} className="font-medium text-gray-400">
                      {item.title}
                    </Label>
                    <p className="text-sm text-gray-400">
                      Funcionalidade em desenvolvimento
                    </p>
                  </div>
                </div>
                <Switch
                  id={item.key}
                  checked={false}
                  disabled={true}
                />
              </div>
            ))}
          </CardContent>
        </Card>

      </main>

      <BottomNav />
    </div>
  );
}
