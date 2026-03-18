import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Wifi, WifiOff, User, Clock, RefreshCw, History } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CatracaEvent {
  tipo: string;
  nome?: string;
  turma?: string;
  status?: string;
  vertente?: string;
  hora?: string;
  catracaId?: string;
}

interface LogEntry {
  nome: string;
  turma: string;
  hora: string;
  vertente: string;
  data: string;
}

interface CatracaLiveStatusProps {
  compact?: boolean;
}

export default function CatracaLiveStatus({ compact = false }: CatracaLiveStatusProps) {
  const { toast } = useToast();
  const [connected, setConnected] = useState(false);
  const [recentEvents, setRecentEvents] = useState<CatracaEvent[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);

  const { data: logData, isLoading: logLoading, refetch: refetchLog } = useQuery<{ data: string; entradas: LogEntry[]; total: number }>({
    queryKey: ['/api/webhook/presenca-log'],
    refetchInterval: 30000,
  });

  useEffect(() => {
    const es = new EventSource("/api/webhook/presenca-events");
    eventSourceRef.current = es;

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    es.onmessage = (event) => {
      if (event.data === "connected") {
        setConnected(true);
        return;
      }
      try {
        const data: CatracaEvent = JSON.parse(event.data);
        setRecentEvents(prev => [data, ...prev].slice(0, 10));

        if (data.tipo === "presenca") {
          toast({
            title: `${data.nome} presente!`,
            description: `${data.turma || ""} - ${data.hora || ""} (${data.vertente === "pec" ? "PEC" : "Inclusão"})`,
          });
          refetchLog();
        } else if (data.tipo === "entrada_desconhecida") {
          toast({
            title: "Entrada desconhecida",
            description: `ID Catraca: ${data.catracaId} - ${data.hora || ""}`,
            variant: "destructive",
          });
        }
      } catch (_) {}
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, []);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {connected ? (
          <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
            <Wifi className="w-3 h-3 mr-1" />
            Catraca Online
          </Badge>
        ) : (
          <Badge variant="outline" className="text-gray-400 border-gray-200">
            <WifiOff className="w-3 h-3 mr-1" />
            Catraca Offline
          </Badge>
        )}
        {recentEvents.length > 0 && recentEvents[0].tipo === "presenca" && (
          <span className="text-xs text-gray-500 animate-pulse">
            {recentEvents[0].nome} - {recentEvents[0].hora}
          </span>
        )}
      </div>
    );
  }

  const historicEntries = logData?.entradas || [];
  const totalEntradas = logData?.total || 0;

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Status Catraca em Tempo Real
          </h3>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => refetchLog()}
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Atualizar
            </Button>
            {connected ? (
              <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
                <Wifi className="w-3 h-3 mr-1" />
                Online
              </Badge>
            ) : (
              <Badge variant="outline" className="text-gray-400 border-gray-200">
                <WifiOff className="w-3 h-3 mr-1" />
                Offline
              </Badge>
            )}
          </div>
        </div>

        {recentEvents.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-medium text-blue-600 mb-1 flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Últimas entradas ao vivo
            </p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {recentEvents.map((ev, i) => (
                <div key={`live-${i}`} className="flex items-center gap-2 text-sm p-1.5 rounded bg-blue-50 border border-blue-100">
                  <User className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  <span className="font-medium truncate">{ev.nome || `ID: ${ev.catracaId}`}</span>
                  {ev.turma && <span className="text-gray-400 truncate">- {ev.turma}</span>}
                  <span className="ml-auto text-xs text-gray-500 flex-shrink-0">{ev.hora}</span>
                  {ev.status === "presente" && (
                    <Badge className="bg-green-100 text-green-700 text-[10px] px-1">P</Badge>
                  )}
                  {ev.status === "ja_presente" && (
                    <Badge className="bg-yellow-100 text-yellow-700 text-[10px] px-1">Dup</Badge>
                  )}
                  {ev.tipo === "entrada_desconhecida" && (
                    <Badge className="bg-red-100 text-red-700 text-[10px] px-1">?</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-600 flex items-center gap-1">
              <History className="w-3 h-3" />
              Entradas de hoje via catraca
              {totalEntradas > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1">{totalEntradas}</Badge>
              )}
            </p>
          </div>

          {logLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Carregando histórico...
            </div>
          ) : historicEntries.length === 0 ? (
            <p className="text-sm text-gray-500 py-2">Nenhuma entrada registrada pela catraca hoje.</p>
          ) : (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {historicEntries.map((entry, i) => (
                <div key={`log-${i}`} className="flex items-center gap-2 text-sm p-1.5 rounded bg-gray-50">
                  <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="font-medium truncate">{entry.nome}</span>
                  <span className="text-gray-400 truncate">- {entry.turma}</span>
                  <Badge variant="outline" className={`text-[10px] px-1 ${entry.vertente === 'pec' ? 'border-purple-300 text-purple-600' : 'border-emerald-300 text-emerald-600'}`}>
                    {entry.vertente === 'pec' ? 'PEC' : 'Inclusão'}
                  </Badge>
                  <span className="ml-auto text-xs text-gray-500 flex-shrink-0">{entry.hora}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
