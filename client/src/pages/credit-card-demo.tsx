import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import CreditCard from '@/components/CreditCard';
import BottomNavigation from '@/components/bottom-navigation';

export default function CreditCardDemo() {
  const [, setLocation] = useLocation();
  const [cardData, setCardData] = useState({
    cardNumber: '4532 1234 5678 9012',
    holderName: 'JOÃO SILVA',
    expiryDate: '12/28',
    cvv: '123'
  });

  const handleInputChange = (field: string, value: string) => {
    setCardData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Exemplos de cartões para teste
  const cardExamples = [
    { label: 'VISA', number: '4532 1234 5678 9012', name: 'JOÃO SILVA' },
    { label: 'Mastercard', number: '5555 4444 3333 2222', name: 'MARIA SANTOS' },
    { label: 'American Express', number: '3782 822463 10005', name: 'CARLOS OLIVEIRA' },
    { label: 'ELO', number: '6362 9797 0000 0000', name: 'ANA COSTA' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/beneficios')}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-gray-900">Cartão de Crédito</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-8">
        {/* Demonstração do cartão */}
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">
              Cartão do Clube do Grito
            </h2>
            <p className="text-gray-600 text-sm">
              Clique no cartão para ver o verso ou no ícone do olho para ocultar o número
            </p>
          </div>
          
          {/* Cartão */}
          <div className="flex justify-center">
            <CreditCard
              cardNumber={cardData.cardNumber}
              holderName={cardData.holderName}
              expiryDate={cardData.expiryDate}
              cvv={cardData.cvv}
              className="mb-6"
            />
          </div>
        </div>

        {/* Formulário para personalizar o cartão */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Personalizar Cartão
          </h3>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="cardNumber" className="text-sm font-medium text-gray-700">
                Número do Cartão
              </Label>
              <Input
                id="cardNumber"
                value={cardData.cardNumber}
                onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                placeholder="0000 0000 0000 0000"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="holderName" className="text-sm font-medium text-gray-700">
                Nome do Portador
              </Label>
              <Input
                id="holderName"
                value={cardData.holderName}
                onChange={(e) => handleInputChange('holderName', e.target.value.toUpperCase())}
                placeholder="NOME COMPLETO"
                className="mt-1"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiryDate" className="text-sm font-medium text-gray-700">
                  Válido até
                </Label>
                <Input
                  id="expiryDate"
                  value={cardData.expiryDate}
                  onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                  placeholder="MM/AA"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="cvv" className="text-sm font-medium text-gray-700">
                  CVV
                </Label>
                <Input
                  id="cvv"
                  value={cardData.cvv}
                  onChange={(e) => handleInputChange('cvv', e.target.value)}
                  placeholder="123"
                  maxLength={4}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Exemplos de cartões */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Exemplos de Cartões
          </h3>
          <div className="space-y-3">
            {cardExamples.map((example, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-start h-auto p-3"
                onClick={() => setCardData({
                  ...cardData,
                  cardNumber: example.number,
                  holderName: example.name
                })}
              >
                <div className="text-left">
                  <div className="font-medium">{example.label}</div>
                  <div className="text-sm text-gray-500">{example.number}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Informações técnicas */}
        <div className="bg-blue-50 rounded-xl p-6 space-y-3">
          <h3 className="text-lg font-semibold text-blue-900">
            Características do Componente
          </h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• Degradê vermelho para preto como especificado</li>
            <li>• Padrão geométrico sutil com triângulos</li>
            <li>• Detecção automática da bandeira do cartão</li>
            <li>• Botão para ocultar/exibir número do cartão</li>
            <li>• Animação 3D de flip para mostrar frente/verso</li>
            <li>• Ícone de chip realista dourado</li>
            <li>• Logo "ECO" posicionado conforme especificação</li>
          </ul>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}