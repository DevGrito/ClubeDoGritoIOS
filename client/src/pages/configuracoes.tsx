import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Sun, Smartphone, Shield, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/bottom-nav";
import { openPrivacyPreferences } from "@/lib/consentManager";
import { PushNotificationSettings } from "@/components/PushNotificationSettings";

export default function Configuracoes() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [settings, setSettings] = useState({
    darkMode: false,
    smsNotifications: true,
    emailNotifications: true,
  });

  const handleSettingChange = (key: string, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem("appSettings", JSON.stringify(newSettings));
    toast({
      title: "Configuração atualizada",
      description: "Suas preferências foram salvas localmente",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
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

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        <PushNotificationSettings />

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
                  <p className="text-sm text-gray-400">Funcionalidade em desenvolvimento</p>
                </div>
              </div>
              <Switch id="darkMode" checked={false} disabled />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-black font-semibold">Privacidade e cookies</CardTitle>
          </CardHeader>
          <CardContent>
            <button
              type="button"
              onClick={() => openPrivacyPreferences()}
              className="w-full flex items-center justify-between py-2 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-yellow-700" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">Privacidade e cookies</p>
                  <p className="text-xs text-gray-500">Preferências e leitura dos documentos legais</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </CardContent>
        </Card>

        <Card className="opacity-50">
          <CardHeader>
            <CardTitle className="text-lg text-black font-semibold">SMS e e-mail</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { icon: Smartphone, title: "SMS", key: "smsNotifications" },
              { icon: Shield, title: "E-mail", key: "emailNotifications" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <Label className="font-medium text-gray-400">{item.title}</Label>
                    <p className="text-sm text-gray-400">Em desenvolvimento</p>
                  </div>
                </div>
                <Switch checked={false} disabled />
              </div>
            ))}
          </CardContent>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
}
