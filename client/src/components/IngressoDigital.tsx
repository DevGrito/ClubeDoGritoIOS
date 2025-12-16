import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, QrCode } from "lucide-react";

interface IngressoDigitalProps {
  numero: string;
  nomeComprador: string;
  emailComprador: string;
  telefoneComprador?: string;
  dataEvento?: string;
  horarioEvento?: string;
  localEvento?: string;
  showQrCode?: boolean;
  className?: string;
}

export default function IngressoDigital({
  numero,
  nomeComprador,
  emailComprador,
  telefoneComprador,
  dataEvento = "23 Out 2025",
  horarioEvento = "19:30",
  localEvento = "A definir",
  showQrCode = true,
  className = ""
}: IngressoDigitalProps) {
  return (
    <Card className={`border-0 shadow-2xl overflow-hidden ${className}`} data-testid="ingresso-digital">
      {/* Ingresso Digital - Template com gradiente vermelho/amarelo */}
      <div className="relative bg-gradient-to-r from-red-600 via-red-500 to-yellow-500 p-6 text-white">
        {/* Header do Ingresso */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-1" data-testid="evento-titulo">IV ENCONTRO</h2>
            <p className="text-xl font-semibold opacity-90" data-testid="evento-subtitulo">Do Grito</p>
          </div>
          <Badge 
            className="bg-white/20 text-white border-white/30 px-3 py-1 text-sm font-bold"
            data-testid="numero-ingresso"
          >
            #{numero}
          </Badge>
        </div>

        {/* Informações do Evento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="flex items-center gap-2" data-testid="info-data">
            <Calendar className="h-5 w-5" />
            <div>
              <p className="text-sm opacity-80">Data</p>
              <p className="font-semibold">{dataEvento}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2" data-testid="info-horario">
            <Clock className="h-5 w-5" />
            <div>
              <p className="text-sm opacity-80">Horário</p>
              <p className="font-semibold">{horarioEvento}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2" data-testid="info-local">
            <MapPin className="h-5 w-5" />
            <div>
              <p className="text-sm opacity-80">Local</p>
              <p className="font-semibold">{localEvento}</p>
            </div>
          </div>
        </div>

        {/* Dados do Comprador */}
        <div className="border-t border-white/20 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div data-testid="comprador-nome">
              <p className="text-sm opacity-80">Nome</p>
              <p className="font-semibold">{nomeComprador}</p>
            </div>
            <div data-testid="comprador-email">
              <p className="text-sm opacity-80">Email</p>
              <p className="font-semibold text-sm break-all">{emailComprador}</p>
            </div>
          </div>
          
          {telefoneComprador && (
            <div className="mt-2" data-testid="comprador-telefone">
              <p className="text-sm opacity-80">Telefone</p>
              <p className="font-semibold">{telefoneComprador}</p>
            </div>
          )}
        </div>

        {/* QR Code */}
        {showQrCode && (
          <div className="absolute top-6 right-6 bg-white p-3 rounded-lg" data-testid="qr-code">
            <QrCode className="h-12 w-12 text-gray-800" />
          </div>
        )}

        {/* Padrão decorativo inferior */}
        <div className="absolute bottom-0 left-0 w-full h-3 bg-gradient-to-r from-yellow-400 to-red-400"></div>
        
        {/* Efeito de perfuração nas bordas (opcional) */}
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-white rounded-full -ml-3 opacity-20"></div>
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-white rounded-full -mr-3 opacity-20"></div>
      </div>
    </Card>
  );
}