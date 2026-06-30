import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  LayoutDashboard, BookOpen, Calendar, Clock, BarChart3,
  Star, Settings, LogOut, ChevronLeft, ChevronRight, FileText,
  Menu, X, CheckCircle2, XCircle, AlertCircle, User, Shield,
  MapPin, Phone, Mail, GraduationCap,
  CalendarDays, Loader2, AlertTriangle, Eye, EyeOff, ImageIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, authFetch } from '@/lib/queryClient';
import { logoutAndClearSession } from '@/lib/auth-session';
import { useAuthSession } from '@/hooks/useAuthSession';
import AreaConsentGate, { AreaConsentLoading, useAreaConsentReady } from '@/components/AreaConsentGate';
import { openPrivacyPreferences } from '@/lib/consentManager';
import { LgpdMeusDadosSettingsPanel } from '@/components/LgpdLegalMenuSection';
import { PushNotificationSettings } from '@/components/PushNotificationSettings';
import logoOGrito from '../app-assets/logo_ogrito_1773942740072.png';

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmtData(d: string | null) {
  if (!d) return '—';
  const dateOnly = d.split('T')[0];
  const [y, m, day] = dateOnly.split('-');
  if (!y || !m || !day) return '—';
  return `${day}/${m}/${y}`;
}
function fmtDiaSemana(d: string | null) {
  if (!d) return '';
  const dateOnly = d.split('T')[0];
  const [y, m, day] = dateOnly.split('-');
  if (!y || !m || !day) return '';
  const dt = new Date(parseInt(y), parseInt(m) - 1, parseInt(day));
  return ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][dt.getDay()];
}
function fmtHora(h: string | null) {
  if (!h) return '';
  return h.slice(0, 5);
}
function initials(nome: string) {
  return nome.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
}
function diaSemanaLabel(d: string) {
  const map: Record<string, string> = {
    segunda: 'Seg', terca: 'Ter', quarta: 'Qua',
    quinta: 'Qui', sexta: 'Sex', sabado: 'Sáb', domingo: 'Dom',
  };
  return map[d] || d;
}
function turnoLabel(t: string | null) {
  if (!t) return '';
  const map: Record<string, string> = { matutino: 'Manhã', vespertino: 'Tarde', noturno: 'Noite' };
  return map[t] || t;
}
function statusColor(s: string) {
  if (s === 'ativo' || s === 'emandamento') return 'bg-green-100 text-green-800 border-green-200';
  if (s === 'concluido') return 'bg-gray-100 text-gray-600 border-gray-200';
  if (s === 'evadido') return 'bg-red-100 text-red-700 border-red-200';
  return 'bg-blue-100 text-blue-700 border-blue-200';
}
function statusLabel(s: string) {
  const map: Record<string, string> = {
    ativo: 'Ativo', emandamento: 'Em Andamento',
    concluido: 'Concluído', evadido: 'Evadido',
    planejado: 'Planejado',
  };
  return map[s] || s;
}
function presencaIcon(s: string) {
  if (s === 'presente') return <CheckCircle2 className="w-4 h-4 text-green-500" />;
  if (s === 'falta') return <XCircle className="w-4 h-4 text-red-500" />;
  return <AlertCircle className="w-4 h-4 text-yellow-500" />;
}
function areaTag(area: string) {
  return area === 'pec'
    ? <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">PEC</span>
    : <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">Inclusão</span>;
}

// ─── NPS colors ───────────────────────────────────────────────────────────────

function npsColor(n: number) {
  if (n >= 9) return 'bg-green-500 text-white hover:bg-green-600';
  if (n >= 7) return 'bg-yellow-400 text-gray-900 hover:bg-yellow-500';
  return 'bg-red-400 text-white hover:bg-red-500';
}
function npsLabel(n: number | null) {
  if (n === null) return '';
  if (n >= 9) return 'Obrigado pelo carinho!';
  if (n >= 7) return 'Como podemos melhorar?';
  return 'Sentimos muito. Nos ajude a melhorar.';
}

// ─── Calendário ───────────────────────────────────────────────────────────────

const DIAS_SEMANA_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const DIA_SEMANA_NUM: Record<string, number> = {
  domingo: 0, segunda: 1, terca: 2, quarta: 3, quinta: 4, sexta: 5, sabado: 6,
};
const SEMANA_UTIL = [1, 2, 3, 4, 5];

function CalendarioMini({ cursos, mes, ano, onMudarMes }: {
  cursos: any[];
  mes: number;
  ano: number;
  onMudarMes: (delta: number) => void;
}) {
  const mesesNomes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

  const primeiroDia = new Date(ano, mes - 1, 1).getDay();
  const diasNoMes   = new Date(ano, mes, 0).getDate();
  const hojeStr     = new Date().toISOString().split('T')[0];
  const hojeNum     = parseInt(hojeStr.split('-')[2]);
  const ehMesAtual  = new Date().getFullYear() === ano && new Date().getMonth() + 1 === mes;

  const cursosAtivos = (cursos || []).filter(c => c.status === 'ativo' || c.status === 'emandamento');

  function temAulaNodia(dia: number): { temAula: boolean; cursosDia: any[] } {
    const data = new Date(ano, mes - 1, dia);
    const dow  = data.getDay();
    const dataStr = `${ano}-${String(mes).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;

    const cursosDia = cursosAtivos.filter(c => {
      const inicio = c.dataInicio ? c.dataInicio : null;
      const fim    = c.dataFim    ? c.dataFim    : null;
      if (inicio && dataStr < inicio) return false;
      if (fim    && dataStr > fim)    return false;

      if (c.diasSemana?.length > 0) {
        return c.diasSemana.some((d: string) => DIA_SEMANA_NUM[d] === dow);
      }
      // se tem turno mas não tem diasSemana → assume seg-sex
      if (c.turno) return SEMANA_UTIL.includes(dow);
      return false;
    });

    return { temAula: cursosDia.length > 0, cursosDia };
  }

  const celulas: (number | null)[] = [];
  for (let i = 0; i < primeiroDia; i++) celulas.push(null);
  for (let d = 1; d <= diasNoMes; d++) celulas.push(d);
  // Sempre 42 células (6 linhas × 7 colunas) para altura fixa
  while (celulas.length < 42) celulas.push(null);

  const [diaVer, setDiaVer] = useState<number | null>(null);

  return (
    <div className="space-y-5">
      {/* Navegação mês */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => { setDiaVer(null); onMudarMes(-1); }}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <span className="text-base font-bold text-gray-900">
          {mesesNomes[mes - 1]} {ano}
        </span>
        <button
          onClick={() => { setDiaVer(null); onMudarMes(1); }}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Grade */}
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => (
          <div key={d} className="text-xs font-semibold text-gray-400 pb-2">{d}</div>
        ))}
        {celulas.map((d, i) => {
          if (!d) return <div key={i} />;
          const { temAula, cursosDia } = temAulaNodia(d);
          const isHoje = ehMesAtual && d === hojeNum;

          return (
            <div
              key={i}
              onClick={() => temAula ? setDiaVer(diaVer === d ? null : d) : undefined}
              className={`flex items-center justify-center mx-auto rounded-full text-sm font-medium transition-all select-none
                w-9 h-9
                ${temAula && diaVer === d ? 'bg-yellow-400 text-gray-900 cursor-pointer' :
                  temAula ? 'bg-yellow-100 text-yellow-800 cursor-pointer hover:bg-yellow-300' :
                  isHoje  ? 'ring-2 ring-yellow-400 text-gray-900' :
                  'text-gray-600'}
                ${isHoje && temAula ? 'ring-2 ring-yellow-500' : ''}
              `}
            >
              {d}
            </div>
          );
        })}
      </div>

      {/* Detalhe do dia clicado */}
      {diaVer && (
        <div className="space-y-2 pt-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {String(diaVer).padStart(2,'0')}/{String(mes).padStart(2,'0')}/{ano}
          </p>
          {temAulaNodia(diaVer).cursosDia.map((c, i) => (
            <div key={i} className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2.5">
              <div className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{c.nome}</p>
                {c.horarioEntrada && (
                  <p className="text-xs text-gray-600">{fmtHora(c.horarioEntrada)} – {fmtHora(c.horarioSaida)}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Legenda */}
      <div className="flex items-center gap-4 text-xs text-gray-500 pt-1 border-t border-gray-100">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-yellow-300 inline-block" />
          Dia com aula
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full border-2 border-yellow-400 inline-block" />
          Hoje
        </span>
      </div>
    </div>
  );
}

// ─── Seções ───────────────────────────────────────────────────────────────────

function SecaoDashboard({ perfil, proxAula, frequencia, cursos, foto }: any) {
  const percentual = frequencia?.percentualGeral ?? 0;
  const cursosAtivos = (cursos || []).filter((c: any) => c.status === 'ativo' || c.status === 'emandamento');

  const freqCor = percentual >= 90
    ? 'text-green-600'
    : percentual >= 75
    ? 'text-yellow-500'
    : 'text-red-500';

  const freqBarCor = percentual >= 90
    ? 'bg-green-500'
    : percentual >= 75
    ? 'bg-yellow-400'
    : 'bg-red-500';

  return (
    <div className="space-y-4">
      {/* Boas vindas */}
      <div className="flex items-center gap-3 py-2">
        <Avatar className="w-12 h-12 border-2 border-gray-200 shrink-0">
          <AvatarImage className="object-cover" src={foto || perfil?.foto || ''} />
          <AvatarFallback className="bg-gray-100 text-gray-400 flex items-center justify-center">
            <ImageIcon className="w-6 h-6" />
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-xs text-gray-500">Bem-vindo(a) de volta</p>
          <h2 className="text-base font-bold text-gray-900 leading-tight truncate">{perfil?.nome || '—'}</h2>
        </div>
      </div>

      {/* Próxima aula */}
      {proxAula && (
        <Card className="border border-yellow-200 bg-yellow-50 shadow-none">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <CalendarDays className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-yellow-700 font-semibold uppercase tracking-wide mb-0.5">Próxima Aula</p>
                <p className="text-sm font-bold text-gray-900">{proxAula.nome}</p>
                <p className="text-xs text-gray-700 mt-0.5">
                  {fmtDiaSemana(proxAula.data) && `${fmtDiaSemana(proxAula.data)}, `}{fmtData(proxAula.data)}{proxAula.horario ? ` às ${fmtHora(proxAula.horario)}` : ''}
                  {proxAula.local ? ` · ${proxAula.local}` : ''}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 gap-3">
        {/* Frequência */}
        <Card className="col-span-2 border border-gray-200 shadow-none">
          <CardContent className="p-4">
            <p className="text-xs text-gray-700 font-medium mb-1">Frequência Geral</p>
            <p className={`text-4xl font-bold ${freqCor}`}>{percentual}%</p>
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${freqBarCor}`} style={{ width: `${percentual}%` }} />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-gray-700">{frequencia?.totalPresente ?? 0} presenças</span>
              <span className="text-xs text-gray-700">{frequencia?.totalFalta ?? 0} faltas</span>
            </div>
          </CardContent>
        </Card>

        {/* Cursos Ativos */}
        <Card className="border border-gray-200 shadow-none">
          <CardContent className="p-4">
            <p className="text-xs text-gray-700 font-medium mb-1">Cursos e Oficinas Ativos</p>
            <p className="text-3xl font-bold text-gray-900">{cursosAtivos.length}</p>
            <p className="text-xs text-gray-600 mt-1">{(cursos || []).length} no total</p>
          </CardContent>
        </Card>

        {/* Próxima aula horário */}
        <Card className="border border-gray-200 shadow-none">
          <CardContent className="p-4">
            <p className="text-xs text-gray-700 font-medium mb-1">Próxima Aula</p>
            {proxAula ? (
              <>
                <p className="text-sm font-bold text-gray-900">{fmtHora(proxAula.horario) || '—'}</p>
                <p className="text-xs text-gray-600 mt-1 truncate">
                  {fmtDiaSemana(proxAula.data) ? `${fmtDiaSemana(proxAula.data)}, ${fmtData(proxAula.data)}` : fmtData(proxAula.data)}
                </p>
                {proxAula.local && <p className="text-xs text-gray-500 truncate">{proxAula.local}</p>}
              </>
            ) : (
              <p className="text-sm text-gray-600">—</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cursos em andamento */}
      {cursosAtivos.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Cursos ou Oficinas em Andamento</p>
          <div className="space-y-2">
            {cursosAtivos.map((c: any, i: number) => (
              <div key={i} className="border-l-[3px] border-l-yellow-400 border border-gray-200 bg-white rounded-lg px-3 py-2.5">
                <p className="text-sm font-semibold text-gray-800 leading-tight">{c.nome}</p>
                <p className="text-xs text-gray-600 mt-0.5">
                  {c.diasSemana?.length > 0 ? c.diasSemana.map(diaSemanaLabel).join(' · ') : (c.turno ? turnoLabel(c.turno) : '')}
                  {c.horarioEntrada ? ` · ${fmtHora(c.horarioEntrada)}–${fmtHora(c.horarioSaida)}` : ''}
                  {c.local ? ` · ${c.local}` : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SecaoCursos({ cursos }: { cursos: any[] }) {
  const [aba, setAba] = useState<'andamento' | 'concluidos'>('andamento');
  const ativos   = (cursos || []).filter(c => c.status === 'ativo' || c.status === 'emandamento' || c.status === 'planejado');
  const concluidos = (cursos || []).filter(c => c.status === 'concluido' || c.status === 'evadido');
  const lista = aba === 'andamento' ? ativos : concluidos;

  return (
    <div className="space-y-4">
      {/* Abas */}
      <div className="flex border-b border-gray-200">
        {(['andamento', 'concluidos'] as const).map(a => (
          <button
            key={a}
            onClick={() => setAba(a)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative
              ${aba === a ? 'text-gray-900' : 'text-gray-400 hover:text-gray-700'}`}
          >
            {a === 'andamento' ? `Em Andamento (${ativos.length})` : `Concluídos (${concluidos.length})`}
            {aba === a && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-400 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Lista */}
      {lista.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-12">
          {aba === 'andamento' ? 'Nenhum curso ou oficina em andamento.' : 'Nenhum curso ou oficina concluído.'}
        </p>
      ) : (
        <div className="space-y-3">
          {lista.map((c, i) => (
            <div key={i} className="border-l-[3px] border-l-yellow-400 border border-gray-200 bg-white rounded-lg p-4">
              <div className="flex items-start justify-between gap-2 mb-3">
                <p className="font-semibold text-gray-900 leading-snug">{c.nome}</p>
                <span className="text-xs text-gray-500 shrink-0">
                  {c.area === 'pec' ? 'PEC' : 'Inclusão'}
                </span>
              </div>
              <div className="space-y-1">
                {c.horarioEntrada && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-700">
                    <Clock className="w-3 h-3 text-yellow-500 shrink-0" />
                    {fmtHora(c.horarioEntrada)} – {fmtHora(c.horarioSaida)}
                  </div>
                )}
                {c.turno && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-700">
                    <Clock className="w-3 h-3 text-yellow-500 shrink-0" />
                    {turnoLabel(c.turno)}
                  </div>
                )}
                {c.diasSemana?.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-700">
                    <CalendarDays className="w-3 h-3 text-yellow-500 shrink-0" />
                    {c.diasSemana.map(diaSemanaLabel).join(' · ')}
                  </div>
                )}
                {c.dataInicio && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-700">
                    <CalendarDays className="w-3 h-3 text-yellow-500 shrink-0" />
                    {fmtData(c.dataInicio)}{c.dataFim ? ` → ${fmtData(c.dataFim)}` : ''}
                  </div>
                )}
                {c.local && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-700">
                    <MapPin className="w-3 h-3 text-yellow-500 shrink-0" />
                    {c.local}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SecaoCalendario({ cursos }: { cursos: any[] }) {
  const hoje = new Date();
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [ano, setAno] = useState(hoje.getFullYear());

  const mudarMes = (delta: number) => {
    let nm = mes + delta;
    let na = ano;
    if (nm > 12) { nm = 1; na++; }
    if (nm < 1) { nm = 12; na--; }
    setMes(nm);
    setAno(na);
  };

  // ── Aulas da Semana ──────────────────────────────────────────────────────
  const DIAS_SEMANA_SEQ = ['segunda','terca','quarta','quinta','sexta','sabado','domingo'];
  const DIAS_LABEL: Record<string, string> = {
    segunda: 'Segunda', terca: 'Terça', quarta: 'Quarta', quinta: 'Quinta',
    sexta: 'Sexta', sabado: 'Sábado', domingo: 'Domingo',
  };
  const DIAS_SHORT: Record<string, string> = {
    segunda: 'Seg', terca: 'Ter', quarta: 'Qua', quinta: 'Qui',
    sexta: 'Sex', sabado: 'Sáb', domingo: 'Dom',
  };

  // Segunda-feira da semana atual
  const inicioSemana = new Date(hoje);
  const dow = hoje.getDay(); // 0=Dom
  inicioSemana.setDate(hoje.getDate() - (dow === 0 ? 6 : dow - 1));

  const cursosAtivos = (cursos || []).filter(c =>
    c.status === 'ativo' || c.status === 'emandamento'
  );

  // Para cada dia Seg–Dom, calcula a data real e verifica quais cursos ocorrem
  const aulasSemanais = DIAS_SEMANA_SEQ.map((diaKey, idx) => {
    const data = new Date(inicioSemana);
    data.setDate(inicioSemana.getDate() + idx);
    const dateStr = `${data.getFullYear()}-${String(data.getMonth()+1).padStart(2,'0')}-${String(data.getDate()).padStart(2,'0')}`;
    const isHoje = dateStr === `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,'0')}-${String(hoje.getDate()).padStart(2,'0')}`;

    const lista = cursosAtivos.filter(c => {
      if (!c.diasSemana?.includes(diaKey)) return false;
      const inicio = c.dataInicio ? c.dataInicio.split('T')[0] : null;
      const fim    = c.dataFim    ? c.dataFim.split('T')[0]    : null;
      if (inicio && dateStr < inicio) return false;
      if (fim    && dateStr > fim)    return false;
      return true;
    });

    return { diaKey, dateStr, data, isHoje, lista };
  }).filter(d => d.lista.length > 0);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <CalendarioMini cursos={cursos} mes={mes} ano={ano} onMudarMes={mudarMes} />
      </div>

      {/* Card Aulas da Semana */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Aulas da Semana
        </p>
        {aulasSemanais.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Nenhuma aula esta semana.</p>
        ) : (
          <div className="space-y-3">
            {aulasSemanais.map(({ diaKey, dateStr, isHoje, lista }) => (
              <div key={diaKey}>
                {/* Cabeçalho do dia */}
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isHoje ? 'bg-yellow-400 text-gray-900' : 'bg-gray-100 text-gray-600'}`}>
                    {DIAS_SHORT[diaKey]}
                  </span>
                  <span className="text-xs text-gray-400">{fmtData(dateStr)}</span>
                  {isHoje && <span className="text-xs text-yellow-600 font-medium">hoje</span>}
                </div>
                {/* Cursos do dia */}
                <div className="space-y-1.5 pl-1">
                  {lista.map((c: any, i: number) => (
                    <div key={i} className="border-l-[3px] border-l-yellow-400 bg-gray-50 rounded-r-lg px-3 py-2">
                      <p className="text-sm font-semibold text-gray-900 leading-tight">{c.nome}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                        {c.horarioEntrada && (
                          <span className="text-xs text-yellow-700 font-medium">
                            {fmtHora(c.horarioEntrada)}–{fmtHora(c.horarioSaida)}
                          </span>
                        )}
                        {c.local && (
                          <span className="text-xs text-gray-500 flex items-center gap-0.5">
                            <MapPin className="w-3 h-3 shrink-0" />{c.local}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SecaoHorarios({ cursos }: { cursos: any[] }) {
  const DIAS = [
    { key: 'segunda', label: 'Segunda', short: 'Seg' },
    { key: 'terca',   label: 'Terça',   short: 'Ter' },
    { key: 'quarta',  label: 'Quarta',  short: 'Qua' },
    { key: 'quinta',  label: 'Quinta',  short: 'Qui' },
    { key: 'sexta',   label: 'Sexta',   short: 'Sex' },
    { key: 'sabado',  label: 'Sábado',  short: 'Sáb' },
    { key: 'domingo', label: 'Domingo', short: 'Dom' },
  ];

  const cursosAtivos = (cursos || []).filter(c =>
    c.status === 'ativo' || c.status === 'emandamento'
  );

  // Para cada dia, lista os cursos que ocorrem naquele dia
  function cursosNoDia(diaKey: string) {
    return cursosAtivos.filter(c => {
      if (c.diasSemana?.length > 0) return c.diasSemana.includes(diaKey);
      // Sem diasSemana mas com turno → seg a sex
      if (c.turno && ['segunda','terca','quarta','quinta','sexta'].includes(diaKey)) return true;
      return false;
    });
  }

  const diasComAula = DIAS.filter(d => cursosNoDia(d.key).length > 0);

  if (cursosAtivos.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Clock className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm">Nenhum horário registrado para seus cursos ativos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Cabeçalho */}
      <div className="grid grid-cols-[80px_1fr] gap-x-4 px-3 pb-2 border-b border-gray-200">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Dia</span>
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Horário · Turma · Local</span>
      </div>

      {diasComAula.map(({ key, label }) => {
        const lista = cursosNoDia(key);
        return (
          <div key={key} className="grid grid-cols-[80px_1fr] gap-x-4 items-start py-3 px-3 border-b border-gray-100 last:border-0">
            {/* Dia */}
            <div className="flex items-center gap-2 pt-0.5">
              <span className="w-1 h-8 rounded-full bg-yellow-400 shrink-0" />
              <span className="text-sm font-bold text-gray-900">{label}</span>
            </div>

            {/* Cursos do dia */}
            <div className="space-y-2">
              {lista.map((c, i) => (
                <div key={i} className="bg-gray-50 rounded-lg px-3 py-2 space-y-0.5">
                  {/* Horário em destaque no topo */}
                  {c.horarioEntrada && (
                    <span className="text-xs font-bold text-yellow-600 tabular-nums">
                      {fmtHora(c.horarioEntrada)} – {fmtHora(c.horarioSaida)}
                    </span>
                  )}
                  {/* Nome do curso */}
                  <p className="text-sm font-semibold text-gray-900 leading-tight">{c.nome}</p>
                  {/* Local / turno */}
                  {(c.local || c.turno) && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      {c.local && <><MapPin className="w-3 h-3 shrink-0" /><span>{c.local}</span></>}
                      {c.turno && !c.local && <><Clock className="w-3 h-3 shrink-0" /><span>{turnoLabel(c.turno)}</span></>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SecaoFrequencia({ frequencia }: { frequencia: any }) {
  if (!frequencia) return (
    <div className="text-center py-12 text-gray-400">
      <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-40" />
      <p>Nenhuma frequência registrada.</p>
    </div>
  );

  const { percentualGeral, totalPresente, totalFalta, turmas, historico } = frequencia;

  // Barra de progresso com cor dinâmica por frequência
  function BarraFrequencia({ valor }: { valor: number }) {
    const cor = valor >= 90 ? 'bg-green-500' : valor >= 75 ? 'bg-yellow-400' : 'bg-red-500';
    return (
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${cor} rounded-full transition-all`}
          style={{ width: `${Math.min(valor, 100)}%` }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Card geral */}
      <div className="bg-gray-50 rounded-xl px-5 py-4 border border-gray-200">
        <div className="flex items-end justify-between mb-3">
          <div>
            <span className="text-4xl font-black text-gray-900">{percentualGeral}%</span>
            <span className="text-sm text-gray-400 ml-2">de frequência geral</span>
          </div>
          <div className="text-right text-xs text-gray-400 space-y-0.5">
            <div><span className="font-semibold text-gray-700">{totalPresente}</span> presenças</div>
            <div><span className="font-semibold text-gray-700">{totalFalta}</span> faltas</div>
          </div>
        </div>
        <BarraFrequencia valor={percentualGeral} />
      </div>

      {/* Por curso */}
      {turmas?.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Por curso ou oficina</p>
          <div className="space-y-1">
            {turmas.map((t: any, i: number) => (
              <div key={i} className="border-b border-gray-100 last:border-0 py-3">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-sm font-semibold text-gray-800 flex-1 truncate mr-3">{t.turma}</p>
                  <span className="text-sm font-bold text-gray-900 tabular-nums shrink-0">{t.percentual}%</span>
                </div>
                <BarraFrequencia valor={t.percentual} />
                <div className="flex gap-4 mt-1.5 text-xs text-gray-400">
                  <span>{t.presencas} presenças</span>
                  <span>{t.faltas} faltas</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Histórico */}
      {historico?.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Histórico recente</p>
          <div className="space-y-0">
            {historico.slice(0, 20).map((h: any, i: number) => (
              <div key={i} className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
                {/* Bolinha de status */}
                <span className={`w-2 h-2 rounded-full shrink-0 ${
                  h.status === 'presente' ? 'bg-yellow-400' :
                  h.status === 'falta'    ? 'bg-gray-300'   : 'bg-gray-200'
                }`} />
                <span className="text-xs text-gray-400 w-20 shrink-0 tabular-nums">{fmtData(h.data)}</span>
                <span className="text-sm text-gray-700 flex-1 truncate">{h.turma}</span>
                <span className={`text-xs font-medium shrink-0 ${
                  h.status === 'presente' ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  {h.status === 'presente' ? 'Presente' : h.status === 'falta' ? 'Falta' : 'Justificada'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SecaoNPS({ cpf }: { cpf: string }) {
  const [pesquisaAtual, setPesquisaAtual] = useState<any | null>(null);
  const [respostas, setRespostas] = useState<Record<number, { valorNumerico: number | null; valorTexto: string; evidenciaUrl?: string }>>({});
  const [visitados, setVisitados] = useState<number[]>([]); // ordered list of visited pergunta IDs
  const [stepId, setStepId] = useState<number | null>(null); // current pergunta ID
  const [enviado, setEnviado] = useState(false);
  const [uploadingEv, setUploadingEv] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pendentes = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/aluno-portal/nps-pendente', cpf],
    queryFn: async () => {
      const r = await authFetch(`/api/aluno-portal/nps-pendente`);
      if (!r.ok) return [];
      return r.json();
    },
    enabled: !!cpf,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      // Only send answers for visited questions
      const payload = visitados.map(id => {
        const val = respostas[id] || { valorNumerico: null, valorTexto: '' };
        return {
          perguntaId: id,
          valorNumerico: val.valorNumerico ?? null,
          valorTexto: val.valorTexto || null,
          evidenciaUrl: val.evidenciaUrl || null,
        };
      });
      const r = await authFetch('/api/nps/respostas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pesquisaId: pesquisaAtual.id, cpf, respostas: payload }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
    },
    onSuccess: () => {
      setEnviado(true);
      queryClient.invalidateQueries({ queryKey: ['/api/aluno-portal/nps-pendente', cpf] });
      toast({ title: 'Obrigado pelo seu feedback!' });
    },
    onError: (e: any) => toast({ title: 'Erro ao enviar', description: e.message, variant: 'destructive' }),
  });

  const iniciarPesquisa = (p: any) => {
    setPesquisaAtual(p);
    setRespostas({});
    const firstId = p.perguntas?.[0]?.id ?? null;
    setStepId(firstId);
    setVisitados(firstId ? [firstId] : []);
    setEnviado(false);
  };

  const resetPesquisa = () => {
    setPesquisaAtual(null);
    setRespostas({});
    setStepId(null);
    setVisitados([]);
  };

  // Compute the next pergunta ID using skip logic
  const computeNextId = (perguntas: any[], currentId: number, resp: typeof respostas): number | null => {
    const sorted = [...perguntas].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
    const BLOCO_DEFAULT_RULE_KEY = "__bloco_padrao__";
    const normalize = (v: any) => String(v || "").trim().toLowerCase();
    const parseLogica = (lc: any) => {
      if (!lc) return {};
      if (typeof lc === "object" && !Array.isArray(lc)) return lc;
      if (typeof lc === "string") {
        try { return JSON.parse(lc); } catch { return {}; }
      }
      return {};
    };
    const currentIdx = sorted.findIndex((p: any) => p.id === currentId);
    if (currentIdx === -1) return null;
    const p = sorted[currentIdx];

    // Apply skip logic for multipla_unica
    if (p.tipo === 'multipla_unica' && p.logica_condicional) {
      const lc = parseLogica(p.logica_condicional);
      const selectedOption = resp[currentId]?.valorTexto;
      if (selectedOption && lc[selectedOption]) {
        const regra = lc[selectedOption];
        if (regra.tipo === 'fim') return null;
        if (regra.tipo === 'pergunta' && regra.ordem) {
          const target = sorted.find((q: any) => q.ordem === regra.ordem);
          if (target) return target.id;
        }
        if (regra.tipo === 'bloco' && regra.bloco_nome) {
          const blocoTarget = normalize(regra.bloco_nome);
          const target = sorted.find((q: any) => normalize(q.bloco_nome) === blocoTarget);
          if (target) return target.id;
        }
      }
    }

    const blocoAtual = normalize(p.bloco_nome);
    if (blocoAtual) {
      const proximaNoMesmoBloco = sorted.slice(currentIdx + 1).find((q: any) => normalize(q.bloco_nome) === blocoAtual);
      if (proximaNoMesmoBloco) return proximaNoMesmoBloco.id;

      const primeiraDoBloco = sorted.find((q: any) => normalize(q.bloco_nome) === blocoAtual);
      const regraPadraoBloco = primeiraDoBloco ? parseLogica(primeiraDoBloco.logica_condicional)?.[BLOCO_DEFAULT_RULE_KEY] : null;
      if (regraPadraoBloco) {
        if (regraPadraoBloco.tipo === "fim") return null;
        if (regraPadraoBloco.tipo === "pergunta" && regraPadraoBloco.ordem) {
          const target = sorted.find((q: any) => q.ordem === regraPadraoBloco.ordem);
          if (target) return target.id;
        }
        if (regraPadraoBloco.tipo === "bloco" && regraPadraoBloco.bloco_nome) {
          const blocoTarget = normalize(regraPadraoBloco.bloco_nome);
          const target = sorted.find((q: any) => normalize(q.bloco_nome) === blocoTarget);
          if (target) return target.id;
        }
      }
    }

    // Default global: next in sequence
    const next = sorted[currentIdx + 1];
    return next ? next.id : null;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-400 mb-3" />
        <p className="text-sm text-gray-400">Verificando pesquisas...</p>
      </div>
    );
  }

  if (enviado) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-yellow-400 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">Obrigado pelo feedback!</h3>
        <p className="text-gray-500 text-sm mt-2 max-w-xs">Sua avaliação foi registrada com sucesso.</p>
        <Button variant="outline" className="mt-6" onClick={() => { setEnviado(false); resetPesquisa(); }}>
          Ver outras pesquisas
        </Button>
      </div>
    );
  }

  // Formulário passo a passo
  if (pesquisaAtual && stepId !== null) {
    const sorted = [...(pesquisaAtual.perguntas || [])].sort((a: any, b: any) => (a.ordem ?? 0) - (b.ordem ?? 0));
    const p = sorted.find((q: any) => q.id === stepId);
    if (!p) return null;

    const stepNum = visitados.length;
    const totalEstimado = sorted.length;
    const progresso = Math.round((stepNum / totalEstimado) * 100);
    const opcoes: string[] = (() => { try { return Array.isArray(p.opcoes) ? p.opcoes : JSON.parse(p.opcoes || '[]'); } catch { return []; } })();

    const nextId = computeNextId(sorted, stepId, respostas);
    const isLast = nextId === null;

    const perguntaRespondida = () => {
      const r = respostas[p.id];
      if (p.tipo === 'escala') return r?.valorNumerico !== null && r?.valorNumerico !== undefined;
      if (p.tipo === 'multipla_unica') return !!r?.valorTexto;
      if (p.tipo === 'multipla_multipla') { try { return JSON.parse(r?.valorTexto || '[]').length > 0; } catch { return false; } }
      if (p.tipo === 'evidencia') return !!r?.evidenciaUrl;
      return true; // texto livre é opcional
    };

    const handleNext = () => {
      if (isLast) {
        mutation.mutate();
        return;
      }
      const nId = computeNextId(sorted, stepId, respostas);
      if (nId !== null) {
        setStepId(nId);
        setVisitados(prev => prev.includes(nId) ? prev : [...prev, nId]);
      }
    };

    const handleBack = () => {
      const prevList = visitados.slice(0, -1);
      const prevId = prevList[prevList.length - 1];
      if (prevId !== undefined) {
        setStepId(prevId);
        setVisitados(prevList);
      } else {
        resetPesquisa();
      }
    };

    const uploadEvidencia = async (file: File) => {
      setUploadingEv(true);
      try {
        const fd = new FormData();
        fd.append('arquivo', file);
        fd.append('pesquisaId', String(pesquisaAtual.id));
        fd.append('perguntaId', String(p.id));
        fd.append('cpf', cpf);
        const r = await authFetch('/api/nps/evidencia-upload', { method: 'POST', body: fd });
        if (!r.ok) throw new Error((await r.json()).error);
        const { url } = await r.json();
        setRespostas(prev => ({ ...prev, [p.id]: { ...prev[p.id], valorNumerico: null, valorTexto: file.name, evidenciaUrl: url } }));
        toast({ title: 'Arquivo enviado!' });
      } catch (e: any) {
        toast({ title: 'Erro ao enviar arquivo', description: e.message, variant: 'destructive' });
      } finally {
        setUploadingEv(false);
      }
    };

    return (
      <div className="space-y-5">
        {/* Cabeçalho */}
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="p-1.5 rounded-lg hover:bg-gray-100">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400">Minha Voz</p>
            <p className="text-sm font-bold text-gray-900 truncate">{pesquisaAtual.titulo}</p>
          </div>
          <span className="text-xs text-gray-400 shrink-0">{stepNum} / {totalEstimado}</span>
        </div>

        {/* Barra de progresso */}
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div className="bg-yellow-400 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progresso}%` }} />
        </div>

        {/* Nome do bloco */}
        {p.bloco_nome && (
          <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-100 rounded-lg">
            <span className="text-xs font-semibold text-purple-600">📦 {p.bloco_nome}</span>
          </div>
        )}

        {/* Pergunta atual */}
        <div className="space-y-4">
          <p className="text-base font-semibold text-gray-900 leading-snug">{p.texto}</p>

          {p.tipo === 'escala' && (
            <div className="space-y-2">
              <div className="grid grid-cols-11 gap-1">
                {Array.from({ length: 11 }, (_, n) => {
                  const sel = respostas[p.id]?.valorNumerico === n;
                  return (
                    <button key={n}
                      onClick={() => setRespostas(prev => ({ ...prev, [p.id]: { ...prev[p.id], valorNumerico: n, valorTexto: prev[p.id]?.valorTexto || '' } }))}
                      className={`aspect-square rounded-lg text-sm font-bold transition-all ${sel ? npsColor(n) + ' scale-110 shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {n}
                    </button>
                  );
                })}
              </div>
              {respostas[p.id]?.valorNumerico !== null && respostas[p.id]?.valorNumerico !== undefined && (
                <p className="text-center text-sm font-medium text-gray-700">{npsLabel(respostas[p.id].valorNumerico!)}</p>
              )}
              <div className="flex justify-between text-xs text-gray-400 px-1">
                <span>Nada provável</span><span>Extremamente provável</span>
              </div>
            </div>
          )}

          {p.tipo === 'texto' && (
            <Textarea
              value={respostas[p.id]?.valorTexto || ''}
              onChange={e => setRespostas(prev => ({ ...prev, [p.id]: { ...prev[p.id], valorNumerico: null, valorTexto: e.target.value } }))}
              placeholder="Escreva sua resposta aqui... (opcional)"
              className="resize-none border-gray-200 focus:border-yellow-400"
              rows={4}
            />
          )}

          {p.tipo === 'multipla_unica' && (
            <div className="space-y-2">
              {opcoes.map((op: string) => {
                const sel = respostas[p.id]?.valorTexto === op;
                return (
                  <button key={op} onClick={() => setRespostas(prev => ({ ...prev, [p.id]: { valorNumerico: null, valorTexto: op } }))}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-medium text-left transition-all ${sel ? 'border-yellow-400 bg-yellow-50 text-gray-900' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}`}>
                    <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${sel ? 'border-yellow-500 bg-yellow-400' : 'border-gray-300'}`}>
                      {sel && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    {op}
                  </button>
                );
              })}
            </div>
          )}

          {p.tipo === 'multipla_multipla' && (
            <div className="space-y-2">
              <p className="text-xs text-gray-400">Selecione todas que se aplicam</p>
              {opcoes.map((op: string) => {
                const sels: string[] = (() => { try { return JSON.parse(respostas[p.id]?.valorTexto || '[]'); } catch { return []; } })();
                const sel = sels.includes(op);
                const toggle = () => {
                  const next = sel ? sels.filter(s => s !== op) : [...sels, op];
                  setRespostas(prev => ({ ...prev, [p.id]: { valorNumerico: null, valorTexto: JSON.stringify(next) } }));
                };
                return (
                  <button key={op} onClick={toggle}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-medium text-left transition-all ${sel ? 'border-yellow-400 bg-yellow-50 text-gray-900' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}`}>
                    <div className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center ${sel ? 'border-yellow-500 bg-yellow-400' : 'border-gray-300'}`}>
                      {sel && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>}
                    </div>
                    {op}
                  </button>
                );
              })}
            </div>
          )}

          {p.tipo === 'evidencia' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">Envie um arquivo como evidência (foto, PDF, etc.)</p>
              {respostas[p.id]?.evidenciaUrl ? (
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-green-800 truncate">{respostas[p.id]?.valorTexto || 'Arquivo enviado'}</p>
                    <p className="text-xs text-green-600">Evidência registrada com sucesso</p>
                  </div>
                  <button onClick={() => setRespostas(prev => ({ ...prev, [p.id]: { valorNumerico: null, valorTexto: '', evidenciaUrl: undefined } }))}
                    className="text-red-400 hover:text-red-600 text-xs">Remover</button>
                </div>
              ) : (
                <label className={`w-full flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl py-8 cursor-pointer transition-colors ${uploadingEv ? 'border-yellow-300 bg-yellow-50' : 'border-gray-300 hover:border-yellow-400 hover:bg-yellow-50'}`}>
                  {uploadingEv ? (
                    <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-gray-300" />
                  )}
                  <span className="text-sm text-gray-500">{uploadingEv ? 'Enviando...' : 'Toque para selecionar o arquivo'}</span>
                  <input type="file" className="hidden" disabled={uploadingEv}
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={e => { const f = e.target.files?.[0]; if (f) uploadEvidencia(f); }} />
                </label>
              )}
            </div>
          )}
        </div>

        {/* Botão Próxima / Enviar */}
        <Button
          className="w-full font-semibold py-3"
          style={{ background: isLast ? '#000' : '#EAB308', color: isLast ? '#fff' : '#000' }}
          disabled={!perguntaRespondida() || mutation.isPending || uploadingEv}
          onClick={handleNext}
        >
          {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          {isLast ? 'Enviar pesquisa' : 'Próxima →'}
        </Button>
      </div>
    );
  }

  // Lista de pesquisas pendentes
  if (pendentes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-6">
        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Star className="w-7 h-7 text-gray-300" />
        </div>
        <p className="text-sm font-semibold text-gray-500">Sem pesquisas de satisfação pendentes no momento.</p>
        <p className="text-xs text-gray-400 mt-1.5 max-w-xs">
          Quando o setor responsável enviar uma, ela aparecerá aqui automaticamente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pesquisas pendentes ({pendentes.length})</p>
      {pendentes.map((p: any) => (
        <button
          key={p.id}
          onClick={() => iniciarPesquisa(p)}
          className="w-full flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3.5 text-left hover:bg-yellow-100 transition-colors group"
        >
          <Star className="w-5 h-5 text-yellow-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{p.titulo}</p>
            <p className="text-xs text-gray-500">{p.perguntas?.length} pergunta(s)</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-yellow-500 transition-colors" />
        </button>
      ))}
    </div>
  );
}

function SecaoConfiguracoes({ perfil, fotoAtual, onSair }: {
  perfil: any; fotoAtual: string | null; onSair: () => void;
}) {
  const { toast } = useToast();

  // Mudar senha
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  async function handleSenha() {
    if (!senhaAtual || !novaSenha || !confirmar) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' }); return;
    }
    if (novaSenha !== confirmar) {
      toast({ title: 'As senhas não coincidem', variant: 'destructive' }); return;
    }
    const senhaOk = novaSenha.length >= 6 && /[A-Z]/.test(novaSenha) && /[a-z]/.test(novaSenha) && /[0-9]/.test(novaSenha);
    if (!senhaOk) {
      toast({ title: 'Senha fraca', description: 'A nova senha deve ter ao menos 6 caracteres, uma letra maiúscula, uma minúscula e um número.', variant: 'destructive' }); return;
    }
    setSalvandoSenha(true);
    try {
      const res = await authFetch('/api/aluno-portal/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf: perfil?.cpf, senhaAtual, novaSenha }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error === 'Senha atual incorreta' ? 'Senha atual incorreta.' : (data?.error || 'Erro ao salvar.');
        toast({ title: 'Não foi possível alterar', description: msg, variant: 'destructive' });
        return;
      }
      toast({ title: 'Senha alterada com sucesso!' });
      setSenhaAtual(''); setNovaSenha(''); setConfirmar('');
    } catch {
      toast({ title: 'Erro de conexão ao salvar senha', variant: 'destructive' });
    } finally {
      setSalvandoSenha(false);
    }
  }

  const info = [
    { label: 'Nome',      value: perfil?.nome,     icon: User },
    { label: 'Telefone',  value: perfil?.telefone,  icon: Phone },
    { label: 'E-mail',    value: perfil?.email,     icon: Mail },
    { label: 'Endereço',  value: [perfil?.logradouro, perfil?.numero, perfil?.bairro, perfil?.cidade].filter(Boolean).join(', '), icon: MapPin },
  ].filter(c => c.value);

  return (
    <div className="space-y-6">

      {/* Foto de perfil */}
      <div className="max-w-md">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Foto de perfil</p>
        <div className="flex items-center gap-5">
          <Avatar className="w-20 h-20 border-2 border-gray-200 shrink-0">
            <AvatarImage className="object-cover" src={fotoAtual || ''} />
            <AvatarFallback className="bg-yellow-400 text-black font-bold text-2xl flex items-center justify-center">
              {(perfil?.nome || 'A').split(' ').slice(0,2).map((n: string) => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-gray-700">Foto cadastrada pela equipe</p>
            <p className="text-xs text-gray-400 mt-0.5">A alteração da foto é feita pelo coordenador ou monitor do instituto.</p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Informações + Mudar Senha — lado a lado no desktop, empilhado no mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1px_1fr] gap-8">

        {/* Informações (somente leitura) */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Informações</p>

          <div className="space-y-3">
            {info.map((c, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="bg-gray-100 rounded-lg p-2 shrink-0">
                  <c.icon className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">{c.label}</p>
                  <p className="text-sm font-medium text-gray-800">{c.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Divisor vertical (desktop only) */}
        <div className="hidden lg:block bg-gray-200" />

        <div className="space-y-8">
          <LgpdMeusDadosSettingsPanel />

          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Notificações push</p>
            <PushNotificationSettings variant="inline" />
          </div>

          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Mudar senha</p>
            <div className="space-y-3">
            <div>
              <Label className="text-xs text-gray-500">Senha atual</Label>
              <div className="relative mt-1">
                <Input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senhaAtual}
                  onChange={e => setSenhaAtual(e.target.value)}
                  className="border-gray-200 pr-10"
                  placeholder="••••••"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setMostrarSenha(v => !v)}
                >
                  {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Nova senha</Label>
              <Input
                type={mostrarSenha ? 'text' : 'password'}
                value={novaSenha}
                onChange={e => setNovaSenha(e.target.value)}
                className="border-gray-200 mt-1"
                placeholder="••••••"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Confirmar nova senha</Label>
              <Input
                type={mostrarSenha ? 'text' : 'password'}
                value={confirmar}
                onChange={e => setConfirmar(e.target.value)}
                className="border-gray-200 mt-1"
                placeholder="••••••"
              />
            </div>
            <Button
              className="w-full bg-black hover:bg-gray-900 text-white font-semibold"
              disabled={salvandoSenha}
              onClick={handleSenha}
            >
              {salvandoSenha ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar nova senha
            </Button>
          </div>
          </div>
        </div>

      </div>

    </div>
  );
}

// ─── Menu config ──────────────────────────────────────────────────────────────

const MENU = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'cursos', label: 'Cursos e Oficinas', icon: BookOpen },
  { id: 'calendario', label: 'Calendário', icon: Calendar },
  { id: 'horarios', label: 'Horários', icon: Clock },
  { id: 'frequencia', label: 'Frequência', icon: BarChart3 },
  { id: 'avaliacao', label: 'Minha Voz', icon: Star },
  { id: 'configuracoes', label: 'Configurações', icon: Settings },
];

const BOTTOM_NAV = ['dashboard', 'cursos', 'frequencia', 'avaliacao', 'configuracoes'];

// ─── Dados de exemplo (preview sem CPF) ──────────────────────────────────────

const MOCK_PERFIL = {
  tipo: 'pec', cpf: '', nome: 'Maria da Silva Santos', foto: null,
  dataNascimento: '2005-03-12', genero: 'Feminino', email: 'maria@exemplo.com',
  telefone: '(11) 98765-4321', status: 'ativo', area: 'pec',
  bairro: 'Vila Madalena', cidade: 'São Paulo', escolaridade: 'Ensino Médio',
  matricula: 'PEC-2025-001',
};

const MOCK_CURSOS = [
  {
    nome: 'Contraturno Manhã — Turma A', area: 'pec', turno: 'matutino',
    horarioEntrada: '08:00', horarioSaida: '10:00', dataInicio: '2025-02-01',
    dataFim: '2025-11-30', local: 'Casa Sonhar', status: 'ativo',
  },
  {
    nome: 'Comunicação Digital — Turma B', area: 'inclusao', turno: null,
    horarioEntrada: '14:00', horarioSaida: '17:00',
    diasSemana: ['segunda', 'quarta', 'sexta'],
    dataInicio: '2025-03-01', dataFim: '2025-09-30',
    local: 'Sede Instituto', status: 'ativo',
  },
  {
    nome: 'Empreendedorismo Jovem', area: 'pec', turno: 'vespertino',
    horarioEntrada: '14:00', horarioSaida: '16:00', dataInicio: '2024-02-01',
    dataFim: '2024-11-30', status: 'concluido',
  },
];

const MOCK_FREQUENCIA = {
  percentualGeral: 87,
  totalPresente: 52,
  totalFalta: 8,
  turmas: [
    { turma: 'Contraturno Manhã — Turma A', area: 'pec', presencas: 34, faltas: 4, percentual: 89 },
    { turma: 'Comunicação Digital — Turma B', area: 'inclusao', presencas: 18, faltas: 4, percentual: 82 },
  ],
  historico: [
    { data: '2025-03-18', turma: 'Contraturno Manhã — Turma A', area: 'pec', status: 'presente' },
    { data: '2025-03-17', turma: 'Comunicação Digital — Turma B', area: 'inclusao', status: 'presente' },
    { data: '2025-03-15', turma: 'Contraturno Manhã — Turma A', area: 'pec', status: 'presente' },
    { data: '2025-03-12', turma: 'Comunicação Digital — Turma B', area: 'inclusao', status: 'falta' },
    { data: '2025-03-11', turma: 'Contraturno Manhã — Turma A', area: 'pec', status: 'presente' },
    { data: '2025-03-10', turma: 'Comunicação Digital — Turma B', area: 'inclusao', status: 'presente' },
  ],
};

const MOCK_PROX_AULA = {
  nome: 'Contraturno Manhã — Turma A', data: '2025-03-20',
  horario: '08:00', local: 'Casa Sonhar', area: 'pec',
};

// ─── Página principal ─────────────────────────────────────────────────────────

export default function AlunoPage() {
  const [location, setLocation] = useLocation();
  const [secao, setSecao] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fotoPortal, setFotoPortal] = useState<string | null>(null);

  const { data: authSession, isLoading: loadingAuth, isFetched: authFetched } = useAuthSession();
  const cpfFromSession = (() => {
    if (authSession?.actorType !== 'aluno_portal') {
      return sessionStorage.getItem('aluno_cpf') || '';
    }
    const fromCpf = String(authSession.cpf || '').replace(/\D/g, '');
    if (fromCpf.length === 11) return fromCpf;
    const fromId = String(authSession.id ?? '').replace(/\D/g, '');
    if (fromId.length === 11) return fromId;
    return sessionStorage.getItem('aluno_cpf') || '';
  })();
  const cpf = cpfFromSession.replace(/\D/g, '');
  const autenticado =
    authSession?.actorType === 'aluno_portal' && cpf.length === 11;

  const { ready: consentReady, checking: consentChecking, markReady: markConsentReady } =
    useAreaConsentReady('students', { enabled: autenticado });

  React.useEffect(() => {
    if (authFetched && !loadingAuth && !autenticado) setLocation('/login/aluno');
  }, [autenticado, authFetched, loadingAuth, setLocation]);

  const usarDemoData = false;

  const { data: perfilReal, isLoading: loadingPerfil, error: errPerfil } = useQuery<any>({
    queryKey: ['/api/aluno-portal/perfil', cpf],
    queryFn: async () => {
      const r = await authFetch(`/api/aluno-portal/perfil`);
      if (!r.ok) throw new Error('Não encontrado');
      return r.json();
    },
    enabled: autenticado && !!cpf,
    retry: false,
  });

  const { data: cursosReal = [], isLoading: loadingCursos } = useQuery<any[]>({
    queryKey: ['/api/aluno-portal/cursos', cpf],
    queryFn: async () => {
      const r = await authFetch(`/api/aluno-portal/cursos`);
      return r.json();
    },
    enabled: autenticado && !!cpf,
  });

  const { data: frequenciaReal, isLoading: loadingFreq } = useQuery<any>({
    queryKey: ['/api/aluno-portal/frequencia', cpf],
    queryFn: async () => {
      const r = await authFetch(`/api/aluno-portal/frequencia`);
      return r.json();
    },
    enabled: autenticado && !!cpf,
  });

  const { data: proxAulaReal } = useQuery<any>({
    queryKey: ['/api/aluno-portal/proxima-aula', cpf],
    queryFn: async () => {
      const r = await authFetch(`/api/aluno-portal/proxima-aula`);
      if (!r.ok) return null;
      return r.json();
    },
    enabled: autenticado && !!cpf,
  });

  const perfil     = usarDemoData ? MOCK_PERFIL     : perfilReal;
  const cursos     = usarDemoData ? MOCK_CURSOS     : cursosReal;
  const frequencia = usarDemoData ? MOCK_FREQUENCIA : frequenciaReal;
  const proxAula   = usarDemoData ? MOCK_PROX_AULA  : proxAulaReal;

  // Sincroniza fotoPortal sempre que a foto do perfil mudar (ex: após novo upload)
  React.useEffect(() => {
    if (perfil?.foto) setFotoPortal(perfil.foto);
  }, [perfil?.foto]);

  const sair = async () => {
    await logoutAndClearSession();
    setLocation('/login/aluno');
  };
  const isLoading = !usarDemoData && (loadingPerfil || loadingCursos || loadingFreq);

  if (!authFetched || loadingAuth || !autenticado) return null;
  if (consentChecking) return <AreaConsentLoading />;
  if (!consentReady) {
    return (
      <AreaConsentGate
        area="students"
        onAccept={() => markConsentReady()}
        onNavigate={setLocation}
      />
    );
  }
  const tituloSecao = MENU.find(m => m.id === secao)?.label || '';

  const renderConteudo = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
          <p className="text-sm text-gray-400">Carregando dados...</p>
        </div>
      );
    }
    if (errPerfil) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertTriangle className="w-10 h-10 text-red-400 mb-3" />
          <p className="text-gray-600 font-medium">Aluno não encontrado para o CPF informado.</p>
        </div>
      );
    }
    switch (secao) {
      case 'dashboard':     return <SecaoDashboard perfil={perfil} proxAula={proxAula} frequencia={frequencia} cursos={cursos} foto={fotoPortal} />;
      case 'cursos':        return <SecaoCursos cursos={cursos} />;
      case 'calendario':    return <SecaoCalendario cursos={cursos} />;
      case 'horarios':      return <SecaoHorarios cursos={cursos} />;
      case 'frequencia':    return <SecaoFrequencia frequencia={frequencia} />;
      case 'avaliacao':     return <SecaoNPS cpf={cpf} />;
      case 'configuracoes': return <SecaoConfiguracoes perfil={perfil} fotoAtual={fotoPortal} onSair={sair} />;
      default:              return null;
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-black flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:static lg:translate-x-0
      `}>
        <div className="relative flex flex-col items-center justify-center px-5 py-2 pb-3 border-b border-white/10">
          <img src={logoOGrito} alt="O Grito" className="h-28 object-contain" />
          <span className="text-white/50 text-xs font-medium tracking-widest uppercase -mt-1">Área do Aluno</span>
          <button className="absolute right-4 top-4 text-white/60 hover:text-white lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {perfil && (
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/10">
            <Avatar className="w-9 h-9 shrink-0">
              <AvatarImage className="object-cover" src={fotoPortal || ''} />
              <AvatarFallback className="bg-yellow-400 text-black font-bold text-sm flex items-center justify-center">
                {(perfil?.nome || 'A').split(' ').slice(0,2).map((n: string) => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm truncate">{perfil?.nome?.split(' ')[0]}</p>
              <div className="flex gap-1 flex-wrap mt-0.5">
                {(() => {
                  const areas = [...new Set((cursos || []).map((c: any) => c.area))];
                  if (areas.length === 0) areas.push(perfil?.area || 'pec');
                  const labels = areas.map((a: any) => a === 'pec' ? 'PEC' : 'Inclusão Produtiva');
                  return (
                    <span className="text-xs text-white/50">{labels.join(' & ')}</span>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto py-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {MENU.map(item => {
            const Icon = item.icon;
            const ativo = secao === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setSecao(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors
                  ${ativo ? 'bg-white/10 text-white border-r-2 border-yellow-400' : 'text-white/50 hover:text-white hover:bg-white/10'}
                `}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={sair}
            className="w-full flex items-center gap-2 text-white/50 hover:text-white text-sm px-2 py-2 rounded hover:bg-white/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Área principal */}
      <div className="flex-1 flex flex-col min-w-0 lg:p-6">
        <div className="flex-1 flex flex-col min-w-0 lg:bg-white lg:rounded-2xl lg:border lg:border-gray-200 lg:shadow-sm lg:overflow-hidden">
          <header className="sticky top-0 z-30 bg-white border-b border-gray-200 flex items-center gap-3 px-4 py-3 lg:px-6">
            <button className="lg:hidden p-1 rounded hover:bg-gray-100" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <h1 className="text-base font-bold text-gray-800">{tituloSecao}</h1>
            </div>
            {perfil && (
              <Avatar className="w-8 h-8 border border-gray-200 shrink-0">
                <AvatarImage className="object-cover" src={fotoPortal || ''} />
                <AvatarFallback className="bg-yellow-400 text-black font-bold text-xs flex items-center justify-center">
                  {(perfil?.nome || 'A').split(' ').slice(0,2).map((n: string) => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
          </header>

          <main className="flex-1 overflow-y-auto p-4 pb-24 lg:pb-6 lg:p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {renderConteudo()}
          </main>
        </div>

        {/* Bottom nav (mobile) */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-black z-30">
          <div className="grid grid-cols-5">
            {BOTTOM_NAV.map(id => {
              const item = MENU.find(m => m.id === id)!;
              const Icon = item.icon;
              const ativo = secao === id;
              return (
                <button
                  key={id}
                  onClick={() => setSecao(id)}
                  className={`flex flex-col items-center gap-0.5 pt-2 pb-3 transition-colors
                    ${ativo ? 'text-yellow-400' : 'text-white/50'}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[9px] font-medium leading-tight text-center w-full truncate px-0.5">{item.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
