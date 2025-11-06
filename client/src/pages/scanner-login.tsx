import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCode, ArrowLeft } from "lucide-react";

export default function ScannerLogin() {
  const [, setLocation] = useLocation();
  const [telefone, setTelefone] = useState("");
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState("");

  const handleLogin = () => {
    const usuarioNormalizado = telefone.trim().toLowerCase();
    const codigoNormalizado = codigo.trim();
    
    // Lista de usuários autorizados
    const usuariosValidos = [
      "scanner1",
      "scanner2", 
      "scanner3",
      "scanner4",
      "scanner5"
    ];
    
    console.log('🔐 [SCANNER LOGIN] Tentativa de login:', {
      usuarioDigitado: telefone,
      usuarioNormalizado,
      codigoDigitado: codigo,
      codigoNormalizado
    });
    
    // Verificar se o usuário está na lista e a senha é 2025
    if (usuariosValidos.includes(usuarioNormalizado) && codigoNormalizado === "2025") {
      // Salvar sessão do scanner com identificação do usuário
      sessionStorage.setItem("scanner_auth", "true");
      sessionStorage.setItem("scanner_user", usuarioNormalizado);
      setLocation("/scanner");
    } else {
      setErro("Usuário ou código incorreto");
      setTimeout(() => setErro(""), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
            <QrCode className="w-8 h-8 text-green-500" />
          </div>
          <CardTitle className="text-2xl text-white">Scanner de Ingressos</CardTitle>
          <CardDescription className="text-gray-400">
            Digite as credenciais de acesso
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Usuário
            </label>
            <Input
              type="text"
              placeholder="scanner1, scanner2, scanner3, scanner4 ou scanner5"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
              data-testid="input-telefone-scanner"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Código de Acesso
            </label>
            <Input
              type="password"
              placeholder="Digite o código"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
              data-testid="input-codigo-scanner"
            />
          </div>

          {erro && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
              <p className="text-red-400 text-sm text-center">{erro}</p>
            </div>
          )}

          <Button 
            onClick={handleLogin}
            className="w-full bg-green-500 hover:bg-green-600 text-white"
            data-testid="button-login-scanner"
          >
            Acessar Scanner
          </Button>

          <Button
            variant="outline"
            onClick={() => setLocation("/")}
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
