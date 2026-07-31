import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Bell, Star, Eye, Target, Music, Users, Briefcase, ShoppingBag, Heart } from "lucide-react";
import { useLocation } from "wouter";
import Logo from "@/components/logo";
import BottomNav from "@/components/bottom-nav";

export default function Sobre() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 pb-nav">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-md mx-auto px-4 pt-12 pb-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/perfil")}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold text-black">Sobre o Clube do Grito</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* O que é o Clube do Grito */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              O que é o Clube do Grito
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Logo do Clube do Grito */}
            <div className="flex justify-center">
              <Logo size="lg" className="mx-auto" />
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              O Clube do Grito é a rede de assinantes solidários que fortalecem os projetos de O Grito. Ao participar, você apoia diretamente os quatro eixos de atuação:
            </p>
            
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-1 flex items-center">
                  <Music className="w-4 h-4 mr-2" />
                  Cultura e Esporte
                </h4>
                <p className="text-sm text-blue-600">
                  Promove oficinas e atividades em áreas como dança, música, capoeira, skate e outras expressões culturais e esportivas, que incentivam talentos, disciplina e inclusão.
                </p>
              </div>
              
              <div className="p-3 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-800 mb-1 flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Socioemocional
                </h4>
                <p className="text-sm text-green-600">
                  Garante acompanhamento psicossocial para fortalecer autoestima, vínculos e desenvolvimento humano.
                </p>
              </div>
              
              <div className="p-3 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-purple-800 mb-1 flex items-center">
                  <Briefcase className="w-4 h-4 mr-2" />
                  Inclusão Produtiva
                </h4>
                <p className="text-sm text-purple-600">
                  Oferece cursos e capacitações que ajudam pessoas a se profissionalizar e ampliar suas oportunidades de trabalho.
                </p>
              </div>
              
              <div className="p-3 bg-orange-50 rounded-lg">
                <h4 className="font-medium text-orange-800 mb-1 flex items-center">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Negócios Sociais
                </h4>
                <p className="text-sm text-orange-600">
                  Formados pela Griffte (confecção de uniformes e moda social) e pelo Outlet Social, que é uma loja de produtos doados e revendidos a preços mais acessíveis. Os recursos gerados são reinvestidos nos setores de O Grito, garantindo sustentabilidade e expansão do impacto.
                </p>
              </div>
            </div>
            
            <p className="text-gray-600 text-sm leading-relaxed font-medium pt-2">
              Mais do que uma assinatura, o Clube é um movimento coletivo que transforma vidas e constrói futuro.
            </p>
          </CardContent>
        </Card>

        {/* Propósito */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Star className="w-5 h-5 mr-2" />
              Propósito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm leading-relaxed">
              Dar voz a quem não tem.
            </p>
          </CardContent>
        </Card>

        {/* Valores */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Heart className="w-5 h-5 mr-2" />
              Valores
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-gray-600 text-sm leading-relaxed">• Acreditar</p>
            <p className="text-gray-600 text-sm leading-relaxed">• Fazer junto</p>
            <p className="text-gray-600 text-sm leading-relaxed">• Ter alegria</p>
            <p className="text-gray-600 text-sm leading-relaxed">• Ter qualidade</p>
            <p className="text-gray-600 text-sm leading-relaxed">• Ser criativo</p>
          </CardContent>
        </Card>

        {/* Visão */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Eye className="w-5 h-5 mr-2" />
              Visão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm leading-relaxed">
              Fazer com que "O Grito" ecoe por todas as arquibancadas do Brasil até 2026, sendo uma plataforma de educação a distância (EAD).
            </p>
          </CardContent>
        </Card>

        {/* Missão */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Missão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm leading-relaxed">
              Mudar a perspectiva de vida das pessoas, contribuindo para a construção da autonomia individual e familiar.
            </p>
          </CardContent>
        </Card>


        {/* Contato */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center text-sm text-gray-600">
              <p>Para dúvidas ou suporte, entre em contato conosco:</p>
              <div className="mt-3 space-y-2">
                <p className="font-medium text-black">
                  📱 (31) 98663-1203
                </p>
                <p className="font-medium text-black">
                  📧 marketing@institutoogrito.org
                </p>
              </div>
            </div>
            
            <div className="text-center text-xs text-gray-500 pt-4 border-t">
              <p>O Grito © 2025</p>
              <p>Todos os direitos reservados</p>
            </div>
          </CardContent>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
}