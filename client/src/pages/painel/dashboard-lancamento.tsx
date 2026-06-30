import { useQuery } from "@tanstack/react-query";
import { clearLocalStoragePreservingLgpd } from "@/lib/auth-session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, TrendingUp, LogOut } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import clubeDoGritoLogo from '../../app-assets/CLUBE_DO_GRITO_LOGO_Prancheta_1_1751996016284_(1)_1764696786533.png';

export default function DashboardLancamento() {
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    clearLocalStoragePreservingLgpd();
    sessionStorage.clear();
    setLocation("/dev/login");
  };

  const { data: launchStats, isLoading: loadingLaunchStats } = useQuery<{
    dataLancamento: string;
    metaDoadores: number;
    doadoresAntes: number;
    novosDoadores: number;
    totalDoadores: number;
    porcentagemMeta: number;
    faltamParaMeta: number;
  }>({
    queryKey: ['/api/launch-stats'],
    refetchInterval: 30000,
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8 flex flex-col justify-center">
      <div className="max-w-7xl mx-auto space-y-8 w-full">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard de Lançamento</h1>
          <div className="flex items-center gap-4">
            <Badge className="bg-green-500 text-white animate-pulse text-lg px-4 py-2" data-testid="badge-live">
              AO VIVO
            </Badge>
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              data-testid="btn-logout"
            >
              <LogOut className="w-5 h-5" />
              Sair
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="border-2 border-yellow-400/50">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <img 
                    src={clubeDoGritoLogo} 
                    alt="Clube do Grito" 
                    className="w-14 h-14 object-contain"
                  />
                  <div>
                    <CardTitle className="text-xl">Meta de Lançamento</CardTitle>
                    <p className="text-base text-gray-500">Clube do Grito - Lançado em 01/12/2025</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingLaunchStats ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-28 rounded-xl" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="bg-gray-50 rounded-xl p-6 text-center" data-testid="card-antes">
                      <p className="text-4xl font-bold text-gray-700">{launchStats?.doadoresAntes || 0}</p>
                      <p className="text-sm text-gray-500 mt-2">Antes do Lançamento</p>
                    </div>
                    <div className="bg-yellow-50 rounded-xl p-6 text-center border border-yellow-200" data-testid="card-novos">
                      <p className="text-4xl font-bold text-yellow-600">{launchStats?.novosDoadores || 0}</p>
                      <p className="text-sm text-yellow-600 mt-2">Novos (desde 01/12)</p>
                    </div>
                    <div className="bg-gray-900 rounded-xl p-6 text-center" data-testid="card-total">
                      <p className="text-4xl font-bold text-white">{launchStats?.totalDoadores || 0}</p>
                      <p className="text-sm text-gray-300 mt-2">Total Doadores</p>
                    </div>
                    <div className="bg-yellow-400 rounded-xl p-6 text-center" data-testid="card-meta">
                      <p className="text-4xl font-bold text-black">{launchStats?.porcentagemMeta || 0}%</p>
                      <p className="text-sm text-black/70 mt-2">da Meta (1.000)</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <Card className="border-2 border-gray-200 h-full flex flex-col">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <Activity className="w-6 h-6 text-yellow-500" />
                Progresso
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center pb-8">
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-44 h-44">
                  <svg className="w-44 h-44 transform -rotate-90">
                    <circle cx="88" cy="88" r="76" stroke="#e5e7eb" strokeWidth="14" fill="none" />
                    <circle 
                      cx="88" cy="88" r="76" 
                      stroke="#facc15" 
                      strokeWidth="14" 
                      fill="none" 
                      strokeDasharray={`${(launchStats?.porcentagemMeta || 0) * 4.78} 478`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold" data-testid="text-percent">{launchStats?.porcentagemMeta || 0}%</span>
                    <span className="text-sm text-gray-500">da meta</span>
                  </div>
                </div>
                <div className="mt-6 text-center">
                  <p className="text-base text-gray-600">Faltam <span className="font-bold text-yellow-600 text-lg" data-testid="text-faltam">{launchStats?.faltamParaMeta || 0}</span> doadores</p>
                  <p className="text-sm text-gray-400 mt-1">para atingir 1.000</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card className="border-2 border-gray-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-yellow-500" />
              Evolução de Doadores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  { dia: '30/11', antes: launchStats?.doadoresAntes || 0, total: launchStats?.doadoresAntes || 0 },
                  { dia: '01/12', antes: launchStats?.doadoresAntes || 0, total: (launchStats?.doadoresAntes || 0) + Math.floor((launchStats?.novosDoadores || 0) * 0.2) },
                  { dia: '02/12', antes: launchStats?.doadoresAntes || 0, total: (launchStats?.doadoresAntes || 0) + Math.floor((launchStats?.novosDoadores || 0) * 0.6) },
                  { dia: 'Hoje', antes: launchStats?.doadoresAntes || 0, total: launchStats?.totalDoadores || 0 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="antes" 
                    stackId="1"
                    stroke="#d1d5db" 
                    fill="#f3f4f6" 
                    name="Base anterior"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#facc15" 
                    fill="#fef08a" 
                    name="Total"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-gray-400">
          Atualização automática a cada 30 segundos
        </div>
      </div>
    </div>
  );
}
