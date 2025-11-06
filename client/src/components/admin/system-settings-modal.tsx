import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Settings, Database, Shield, Bell, Mail, Server } from "lucide-react";

interface SystemSettings {
  maintenanceMode: boolean;
  userRegistration: boolean;
  smsVerification: boolean;
  emailNotifications: boolean;
  systemName: string;
  maxUsersPerPlan: number;
  sessionTimeout: number;
  backupFrequency: string;
  debugMode: boolean;
  autoBackup: boolean;
}

export default function SystemSettingsModal() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>({
    maintenanceMode: false,
    userRegistration: true,
    smsVerification: true,
    emailNotifications: true,
    systemName: "Clube do Grito",
    maxUsersPerPlan: 1000,
    sessionTimeout: 24,
    backupFrequency: "daily",
    debugMode: false,
    autoBackup: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("GET", "/api/admin/system-settings");
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar as configurações.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiRequest("POST", "/api/admin/system-settings", settings);
      toast({
        title: "Configurações salvas",
        description: "As configurações do sistema foram atualizadas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackup = async () => {
    try {
      await apiRequest("POST", "/api/admin/backup");
      toast({
        title: "Backup iniciado",
        description: "O backup do sistema foi iniciado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível iniciar o backup.",
        variant: "destructive",
      });
    }
  };

  const handleClearCache = async () => {
    try {
      await apiRequest("POST", "/api/admin/clear-cache");
      toast({
        title: "Cache limpo",
        description: "O cache do sistema foi limpo com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível limpar o cache.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-yellow-400">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-slate-500 hover:bg-slate-600 rounded-lg flex items-center justify-center text-white">
                <Settings className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-black text-sm">
                  Gerenciar Sistema
                </h4>
                <p className="text-xs text-gray-600 mt-1">
                  Configurações avançadas do sistema
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Configurações do Sistema</span>
          </DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="text-sm text-gray-600 mt-2">Carregando configurações...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* General Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Configurações Gerais</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="systemName">Nome do Sistema</Label>
                  <Input
                    id="systemName"
                    value={settings.systemName}
                    onChange={(e) => setSettings(prev => ({ ...prev, systemName: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="maxUsers">Máximo de Usuários por Plano</Label>
                  <Input
                    id="maxUsers"
                    type="number"
                    value={settings.maxUsersPerPlan}
                    onChange={(e) => setSettings(prev => ({ ...prev, maxUsersPerPlan: parseInt(e.target.value) }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="sessionTimeout">Timeout de Sessão (horas)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => setSettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Configurações de Segurança</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="maintenanceMode">Modo de Manutenção</Label>
                    <p className="text-sm text-gray-600">Bloqueia acesso ao sistema</p>
                  </div>
                  <Switch
                    id="maintenanceMode"
                    checked={settings.maintenanceMode}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, maintenanceMode: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="userRegistration">Permitir Cadastro</Label>
                    <p className="text-sm text-gray-600">Habilita novos registros</p>
                  </div>
                  <Switch
                    id="userRegistration"
                    checked={settings.userRegistration}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, userRegistration: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="smsVerification">Verificação SMS</Label>
                    <p className="text-sm text-gray-600">Obrigatória para login</p>
                  </div>
                  <Switch
                    id="smsVerification"
                    checked={settings.smsVerification}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, smsVerification: checked }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* System Operations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Server className="w-5 h-5" />
                  <span>Operações do Sistema</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="debugMode">Modo Debug</Label>
                    <p className="text-sm text-gray-600">Logs detalhados</p>
                  </div>
                  <Switch
                    id="debugMode"
                    checked={settings.debugMode}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, debugMode: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="autoBackup">Backup Automático</Label>
                    <p className="text-sm text-gray-600">Backup diário automático</p>
                  </div>
                  <Switch
                    id="autoBackup"
                    checked={settings.autoBackup}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoBackup: checked }))}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleBackup}
                    variant="outline"
                    className="flex-1"
                  >
                    <Database className="w-4 h-4 mr-2" />
                    Fazer Backup
                  </Button>
                  <Button
                    onClick={handleClearCache}
                    variant="outline"
                    className="flex-1"
                  >
                    <Server className="w-4 h-4 mr-2" />
                    Limpar Cache
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="px-8"
              >
                {isSaving ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}