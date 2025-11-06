import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Moon, Sun, Bell, Shield, Smartphone } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/bottom-nav";

export default function Configuracoes() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    darkMode: false,
    notifications: true,
    smsNotifications: true,
    emailNotifications: true,
  });

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem("appSettings");
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSettingChange = (key: string, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem("appSettings", JSON.stringify(newSettings));
    
    if (key === "darkMode") {
      // Apply dark mode (this would need proper implementation)
      document.documentElement.classList.toggle("dark", value);
    }
    
    toast({
      title: "Configuração atualizada",
      description: "Suas preferências foram salvas",
    });
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
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/perfil")}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold text-black">Configurações</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
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
            <CardTitle className="text-lg text-black font-semibold">Notificações</CardTitle>
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