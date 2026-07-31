import { useState, useEffect, useRef } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, Play, Pause, X } from "lucide-react";
import logoImg from "../../app-assets/image_1769454113778.png";
import GestaoVistaViewGate from "@/components/GestaoVistaViewGate";
import TabGeral from "./TabGeral";
import TabInclusao from "./TabInclusao";
import TabPEC from "./TabPEC";
import TabPsico from "./TabPsico";
import TabMarketing from "./TabMarketing";
import TabNegocios from "./TabNegocios";
import TabDemografico from "./TabDemografico";
import TabFavela3D from "./TabFavela3D";
import { MESES, ANOS, type PeriodoFiltro, periodoLabel, isPeriodoTodos } from "./shared";

const TABS = [
  { id: 'geral', label: 'Geral', short: 'Geral', color: '#10b981' },
  { id: 'inclusao', label: 'Inclusão Produtiva', short: 'Inclusão', color: '#3b82f6' },
  { id: 'pec', label: 'Programa de Esporte e Cultura', short: 'PEC', color: '#10b981' },
  { id: 'psico', label: 'Psicossocial', short: 'Psicossocial', color: '#8b5cf6' },
  { id: 'favela3d', label: 'Favela 3D', short: 'Favela 3D', color: '#8b5cf6' },
  { id: 'marketing', label: 'Marketing e Tecnologia', short: 'Marketing', color: '#ec4899' },
  { id: 'negocios', label: 'Negócios Sociais', short: 'Negócios', color: '#f97316' },
  { id: 'demografico', label: 'Dados Demográficos', short: 'Demográfico', color: '#06b6d4' },
];

const ROTATION_INTERVAL = 120000;

interface Props {
  onClose?: () => void;
  /** Quando true, encaixa em páginas (ex.: Conselho) em vez de ocupar a tela inteira */
  embedded?: boolean;
}

export default function DashboardGestaoVista(props: Props) {
  return (
    <GestaoVistaViewGate>
      <DashboardGestaoVistaContent {...props} />
    </GestaoVistaViewGate>
  );
}

function DashboardGestaoVistaContent({ onClose, embedded = false }: Props) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [ano, setAno] = useState('2026');
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('todos');
  const [mesesOpen, setMesesOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 768
  );

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const isMesFuturo = (mNum: number) => {
    if (mNum === 0) return false;
    const hoje = new Date();
    const anoSel = parseInt(ano);
    if (anoSel < hoje.getFullYear()) return false;
    if (anoSel > hoje.getFullYear()) return true;
    return mNum > hoje.getMonth() + 1;
  };

  useEffect(() => {
    if (periodo === 'todos') return;
    const validos = periodo.filter(m => !isMesFuturo(m));
    if (validos.length !== periodo.length) {
      setPeriodo(validos.length === 0 ? 'todos' : validos.sort((a, b) => a - b));
    }
  }, [ano]);

  const toggleMes = (mNum: number) => {
    if (isMesFuturo(mNum)) return;
    setPeriodo(prev => {
      if (prev === 'todos') return [mNum];
      const has = prev.includes(mNum);
      const next = has ? prev.filter(m => m !== mNum) : [...prev, mNum];
      return next.length === 0 ? 'todos' : next.sort((a, b) => a - b);
    });
  };

  const selectTodosMeses = () => {
    setPeriodo('todos');
    setMesesOpen(false);
  };

  const filtroMesesLabel = isPeriodoTodos(periodo)
    ? 'Todos os Meses'
    : periodoLabel(periodo, ano);

  const [tabIdx, setTabIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

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
  const goNext = () => { setTabIdx(p => (p + 1) % TABS.length); setIsPaused(true); };
  const goPrev = () => { setTabIdx(p => (p - 1 + TABS.length) % TABS.length); setIsPaused(true); };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.changedTouches.length !== 1 || touchStartX.current === 0) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = 0;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx < 0) goNext(); else goPrev();
    }
  };

  const tabContent = (
    <>
      {currentTab.id === 'geral' && <TabGeral ano={ano} periodo={periodo} isMobile={isMobile} />}
      {currentTab.id === 'inclusao' && <TabInclusao ano={ano} periodo={periodo} />}
      {currentTab.id === 'pec' && <TabPEC ano={ano} periodo={periodo} />}
      {currentTab.id === 'psico' && <TabPsico ano={ano} periodo={periodo} />}
      {currentTab.id === 'favela3d' && <TabFavela3D ano={ano} periodo={periodo} />}
      {currentTab.id === 'marketing' && <TabMarketing ano={ano} periodo={periodo} />}
      {currentTab.id === 'negocios' && <TabNegocios ano={ano} periodo={periodo} />}
      {currentTab.id === 'demografico' && <TabDemografico ano={ano} periodo={periodo} />}
    </>
  );

  const shellHeight = embedded ? 'min(85dvh, 920px)' : '100dvh';
  const shellClass = embedded
    ? 'rounded-xl overflow-hidden border border-slate-700/60 shadow-lg'
    : '';

  /* ─────────────────────────────────────────────────────────────────── */
  /* MOBILE LAYOUT                                                        */
  /* ─────────────────────────────────────────────────────────────────── */
  if (isMobile) {
    return (
      <div
        className={`bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col ${shellClass}`}
        style={{ height: shellHeight }}
      >
        {/* ── Mobile Header ── */}
        <div className="flex-shrink-0 bg-slate-800/80 border-b border-slate-700/50 px-4 py-3 flex flex-col gap-2.5">
          {/* Row 1: Logo + Tab name — centralizado */}
          <div className="flex items-center justify-center gap-1.5">
            <img src={logoImg} alt="O Grito" className="h-14 object-contain flex-shrink-0" />
            <div className="text-center">
              <p className="text-white font-bold text-base leading-tight">{currentTab.label}</p>
              <p className="text-slate-400 text-[11px] leading-tight">Gestão à Vista</p>
            </div>
          </div>

          {/* Row 2: Navegação entre tabs — centralizado */}
          <div className="flex items-center justify-center gap-1.5">
            <button
              onClick={() => setIsPaused(p => !p)}
              className={`p-2 rounded-lg transition-all ${isPaused ? 'bg-emerald-500' : 'bg-slate-700'}`}
            >
              {isPaused ? <Play className="w-3.5 h-3.5 text-white" /> : <Pause className="w-3.5 h-3.5 text-white" />}
            </button>
            <button onClick={goPrev} className="p-2 rounded-lg bg-slate-700">
              <ChevronLeft className="w-3.5 h-3.5 text-white" />
            </button>
            <div className="flex gap-1 items-center px-1">
              {TABS.map((tab, i) => (
                <button
                  key={tab.id}
                  onClick={() => { setTabIdx(i); setIsPaused(true); }}
                  className="w-1.5 h-1.5 rounded-full transition-all"
                  style={{ backgroundColor: tabIdx === i ? '#facc15' : '#facc1550' }}
                />
              ))}
            </div>
            <button onClick={goNext} className="p-2 rounded-lg bg-slate-700">
              <ChevronRight className="w-3.5 h-3.5 text-white" />
            </button>
            {onClose && (
              <button onClick={onClose} className="p-2 rounded-full bg-slate-700">
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            )}
          </div>

          {/* Row 3: Filtros — select nativo para garantir funcionamento mobile */}
          <div className="flex items-center gap-1.5">
            <select
              value={ano}
              onChange={e => setAno(e.target.value)}
              className="flex-shrink-0 rounded-lg bg-slate-700 border border-slate-600 text-white text-xs h-8 px-2 appearance-none"
            >
              {ANOS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>

            <Popover open={mesesOpen} onOpenChange={setMesesOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex-1 min-w-0 rounded-lg bg-slate-700 border border-slate-600 text-white text-xs h-8 px-2 flex items-center justify-between gap-1"
                >
                  <span className="truncate text-left">{filtroMesesLabel}</span>
                  <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-52 p-2 bg-slate-800 border-slate-700 z-[10001]" align="start">
                <button
                  type="button"
                  onClick={selectTodosMeses}
                  className={`w-full text-left text-xs px-2 py-1.5 rounded mb-1 ${isPeriodoTodos(periodo) ? 'bg-yellow-500/20 text-yellow-400' : 'text-slate-300 hover:bg-slate-700'}`}
                >
                  Todos os Meses
                </button>
                <div className="border-t border-slate-700 my-1" />
                {MESES.filter(m => m.value !== 'todos').map(m => {
                  const mNum = parseInt(m.value);
                  const futuro = isMesFuturo(mNum);
                  const checked = periodo !== 'todos' && periodo.includes(mNum);
                  return (
                    <label
                      key={m.value}
                      className={`flex items-center gap-2 px-2 py-1 rounded text-xs ${futuro ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-700'}`}
                    >
                      <Checkbox
                        checked={checked}
                        disabled={futuro}
                        onCheckedChange={() => toggleMes(mNum)}
                        className="border-slate-500 data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500"
                      />
                      <span className="text-slate-200">{m.label}</span>
                    </label>
                  );
                })}
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* ── Mobile Content: scrollable — swipe aqui apenas ── */}
        <div
          className="flex-1 overflow-y-auto p-2 gap-2 flex flex-col"
          style={{ touchAction: 'pan-y pinch-zoom' }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {tabContent}
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────────── */
  /* DESKTOP LAYOUT (unchanged)                                           */
  /* ─────────────────────────────────────────────────────────────────── */
  return (
    <div
      className={`${embedded ? '' : 'min-h-screen'} bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col p-2 lg:p-3 gap-2 lg:gap-3 overflow-y-auto md:overflow-hidden ${shellClass}`}
      style={{ height: shellHeight, touchAction: 'pan-y pinch-zoom' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ─── HEADER ─── */}
      <div className="flex items-center justify-between bg-slate-800/50 rounded-xl px-3 lg:px-6 py-1.5 lg:py-2 flex-wrap gap-2 flex-shrink-0">
        <div className="flex items-center gap-3 lg:gap-5">
          <img src={logoImg} alt="O Grito" className="h-20 lg:h-28 object-contain -my-2 lg:-my-3" />
          <div>
            <h1 className="text-lg lg:text-2xl font-bold text-white">Gestão à Vista</h1>
            <p className="text-slate-400 text-xs lg:text-sm">O Grito</p>
          </div>
        </div>

        <div className="flex items-center gap-2 lg:gap-4 flex-wrap">
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
                    onClick={() => { setTabIdx(i); setIsPaused(true); }}
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

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <Select value={ano} onValueChange={setAno}>
              <SelectTrigger className="w-[90px] bg-slate-700/50 border-slate-600 text-white text-sm h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 z-[10001]">
                {ANOS.map(a => (
                  <SelectItem key={a} value={a} className="text-white hover:bg-slate-700">{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Popover open={mesesOpen} onOpenChange={setMesesOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="w-[min(220px,28vw)] h-8 px-3 rounded-md border border-slate-600 bg-slate-700/50 text-white text-sm flex items-center justify-between gap-2 hover:bg-slate-700"
                >
                  <span className="truncate">{filtroMesesLabel}</span>
                  <ChevronDown className="w-4 h-4 flex-shrink-0 opacity-70" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2 bg-slate-800 border-slate-700 z-[10001]" align="start">
                <button
                  type="button"
                  onClick={selectTodosMeses}
                  className={`w-full text-left text-sm px-2 py-1.5 rounded mb-1 ${isPeriodoTodos(periodo) ? 'bg-yellow-500/20 text-yellow-400 font-medium' : 'text-slate-300 hover:bg-slate-700'}`}
                >
                  Todos os Meses
                </button>
                <div className="border-t border-slate-700 my-1" />
                {MESES.filter(m => m.value !== 'todos').map(m => {
                  const mNum = parseInt(m.value);
                  const futuro = isMesFuturo(mNum);
                  const checked = periodo !== 'todos' && periodo.includes(mNum);
                  return (
                    <label
                      key={m.value}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm ${futuro ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-700'}`}
                    >
                      <Checkbox
                        checked={checked}
                        disabled={futuro}
                        onCheckedChange={() => toggleMes(mNum)}
                        className="border-slate-500 data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500"
                      />
                      <span className="text-slate-200">{m.label}</span>
                    </label>
                  );
                })}
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center gap-2 border-l border-slate-600 pl-2 lg:pl-4">
            <div className="text-right">
              <p className="text-xl lg:text-3xl font-mono text-white font-bold">
                {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-slate-400 text-[10px] lg:text-sm">
                {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-slate-700 hover:bg-slate-600 transition-all flex-shrink-0"
                aria-label="Fechar dashboard"
              >
                <X className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── TAB TITLE BADGE ─── */}
      {currentTab.id !== 'demografico' && (
        <div className="flex items-center gap-2 px-1 flex-shrink-0">
          <span className="text-sm font-bold uppercase tracking-wider text-white">
            {currentTab.label}
          </span>
          <div className="flex-1 h-px" style={{ backgroundColor: '#facc1530' }} />
        </div>
      )}

      {/* ─── CONTEÚDO ─── */}
      <div className="flex-1 md:min-h-0 md:overflow-hidden">
        {tabContent}
      </div>
    </div>
  );
}
