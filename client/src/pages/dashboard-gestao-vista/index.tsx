import { useState, useEffect, useRef } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import logoImg from "../../app-assets/image_1769454113778.png";
import TabGeral from "./TabGeral";
import TabInclusao from "./TabInclusao";
import TabPEC from "./TabPEC";
import TabPsico from "./TabPsico";
import TabMarketing from "./TabMarketing";
import TabNegocios from "./TabNegocios";
import TabDemografico from "./TabDemografico";
import { MESES, ANOS } from "./shared";

const TABS = [
  { id: 'geral',      label: 'Geral',                 color: '#10b981' },
  { id: 'inclusao',   label: 'Inclusão Produtiva',     color: '#3b82f6' },
  { id: 'pec',        label: 'Programa de Esporte e Cultura', color: '#10b981' },
  { id: 'psico',      label: 'Psicossocial',           color: '#8b5cf6' },
  { id: 'marketing',  label: 'Marketing e Tecnologia', color: '#ec4899' },
  { id: 'negocios',   label: 'Negócios Sociais',       color: '#f97316' },
  { id: 'demografico',label: 'Dados Demográficos',     color: '#06b6d4' },
];

const ROTATION_INTERVAL = 120000;

export default function DashboardGestaoVista() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [ano, setAno] = useState('2026');
  const [mes, setMes] = useState('todos');
  const [tabIdx, setTabIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const tabIdxRef = useRef(0);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const t = setInterval(() => setTabIdx(p => (p + 1) % TABS.length), ROTATION_INTERVAL);
    return () => clearInterval(t);
  }, [isPaused]);

  const currentTab = TABS[tabIdx];

  const goNext = () => setTabIdx(p => (p + 1) % TABS.length);
  const goPrev = () => setTabIdx(p => (p - 1 + TABS.length) % TABS.length);

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col p-2 lg:p-3 gap-2 lg:gap-3 overflow-y-auto md:overflow-hidden"
      style={{ height: '100dvh' }}
    >
      {/* ─── HEADER ─── */}
      <div className="flex items-center justify-between bg-slate-800/50 rounded-xl px-3 lg:px-6 py-1.5 lg:py-2 flex-wrap gap-2 flex-shrink-0">
        {/* Logo + título */}
        <div className="flex items-center gap-3 lg:gap-5">
          <img src={logoImg} alt="O Grito" className="h-20 lg:h-28 object-contain -my-2 lg:-my-3" />
          <div>
            <h1 className="text-lg lg:text-2xl font-bold text-white">Gestão à Vista</h1>
            <p className="text-slate-400 text-xs lg:text-sm">O Grito</p>
          </div>
        </div>

        {/* Controles */}
        <div className="flex items-center gap-2 lg:gap-4 flex-wrap">
          {/* Navegação */}
          <div className="flex items-center gap-1 lg:gap-2 border-r border-slate-600 pr-2 lg:pr-4">
            <button
              onClick={() => setIsPaused(p => !p)}
              className={`p-1.5 lg:p-2 rounded-lg transition-all ${isPaused ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-slate-700 hover:bg-slate-600'}`}
              title={isPaused ? 'Continuar' : 'Pausar'}
            >
              {isPaused ? <Play className="w-3 h-3 lg:w-4 lg:h-4 text-white" /> : <Pause className="w-3 h-3 lg:w-4 lg:h-4 text-white" />}
            </button>
            <button onClick={goPrev} className="p-1.5 lg:p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-all">
              <ChevronLeft className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
            </button>
            <div className="flex flex-col items-center gap-1.5 px-1 lg:px-2">
              <div className="flex items-center gap-1 lg:gap-1.5">
                {TABS.map((tab, i) => (
                  <button
                    key={tab.id}
                    onClick={() => setTabIdx(i)}
                    title={tab.label}
                    className="w-2 h-2 lg:w-2.5 lg:h-2.5 rounded-full transition-all"
                    style={{ backgroundColor: tabIdx === i ? '#facc15' : '#facc15aa' }}
                  />
                ))}
              </div>
              <span className="text-[10px] lg:text-[11px] font-medium text-white whitespace-nowrap">
                {currentTab.label}
              </span>
            </div>
            <button onClick={goNext} className="p-1.5 lg:p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-all">
              <ChevronRight className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
            </button>
          </div>

          {/* Filtros */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <Select value={ano} onValueChange={setAno}>
              <SelectTrigger className="w-[90px] bg-slate-700/50 border-slate-600 text-white text-sm h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {ANOS.map(a => (
                  <SelectItem key={a} value={a} className="text-white hover:bg-slate-700">{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={mes} onValueChange={setMes}>
              <SelectTrigger className="w-[170px] bg-slate-700/50 border-slate-600 text-white text-sm h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {MESES.map(m => (
                  <SelectItem key={m.value} value={m.value} className="text-white hover:bg-slate-700">{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Relógio */}
          <div className="text-right border-l border-slate-600 pl-2 lg:pl-4">
            <p className="text-xl lg:text-3xl font-mono text-white font-bold">
              {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-slate-400 text-[10px] lg:text-sm">
              {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>
      </div>

      {/* ─── TAB TITLE BADGE ─── */}
      {currentTab.id !== 'demografico' && (
        <div className="flex items-center gap-2 px-1 flex-shrink-0">
          <span className="text-sm font-bold uppercase tracking-wider text-white">
            {currentTab.label}
          </span>
          <div className="flex-1 h-px" style={{ backgroundColor: `${currentTab.color}30` }} />
        </div>
      )}

      {/* ─── CONTEÚDO ─── */}
      <div className="flex-1 md:min-h-0 md:overflow-hidden">
        {currentTab.id === 'geral'       && <TabGeral      ano={ano} mes={mes} />}
        {currentTab.id === 'inclusao'    && <TabInclusao   ano={ano} mes={mes} />}
        {currentTab.id === 'pec'         && <TabPEC        ano={ano} mes={mes} />}
        {currentTab.id === 'psico'       && <TabPsico      ano={ano} mes={mes} />}
        {currentTab.id === 'marketing'   && <TabMarketing  ano={ano} mes={mes} />}
        {currentTab.id === 'negocios'    && <TabNegocios   ano={ano} mes={mes} />}
        {currentTab.id === 'demografico' && <TabDemografico ano={ano} mes={mes} />}
      </div>
    </div>
  );
}
