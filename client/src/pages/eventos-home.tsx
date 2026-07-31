import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Search, MapPin, Calendar, ChevronLeft, ChevronRight, Ticket, UserCircle, LogOut } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import logoPath from "../app-assets/Logo_Clube_Do_grito.png";
import { usePortalAuth } from "../hooks/usePortalAuth";
import LoginModal from "../components/portal/LoginModal";

const BRAND = "#f59e0b";
const GREEN = "#058d4c";
const YELLOW = "#ffcc00";

const CATEGORIAS = [
  { id: "todos", label: "Todos" },
  { id: "cultura", label: "Cultura" },
  { id: "esporte", label: "Esporte" },
  { id: "formacao", label: "Formação" },
  { id: "saude", label: "Saúde" },
  { id: "outro", label: "Outros" },
];

function StatusBadge({ status }: { status: string }) {
  if (status === "disponivel" || status === "ativo")
    return <span className="text-white text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#058d4c" }}>Disponível</span>;
  if (status === "em_breve")
    return <span className="text-gray-900 text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#ffcc00" }}>Em breve</span>;
  return <span className="bg-gray-400 text-white text-xs font-bold px-2 py-0.5 rounded-full">Encerrado</span>;
}

function EventCard({ evento, onClick }: { evento: any; onClick: () => void }) {
  const data = new Date(evento.data_inicio);
  const dataFmt = format(data, "dd 'de' MMMM", { locale: ptBR });
  const hora = evento.hora_inicio || format(data, "HH:mm");

  return (
    <div
      onClick={onClick}
      className="cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all duration-200 flex flex-col"
    >
      <div className="relative h-44 bg-gray-200 overflow-hidden flex-shrink-0">
        {evento.banner_url ? (
          <img src={evento.banner_url} alt={evento.titulo} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-500 to-amber-700">
            <span className="text-white text-5xl">🎉</span>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <StatusBadge status={evento.status} />
        </div>
        {evento.gratuito && (
          <div className="absolute top-2 left-2 text-gray-900 text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#ffcc00" }}>
            Gratuito
          </div>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col justify-between">
        <h3 className="font-bold text-gray-900 text-base leading-tight mb-2 line-clamp-2">{evento.titulo}</h3>
        <div className="space-y-1">
          {evento.local && (
            <div className="flex items-center gap-1 text-gray-500 text-xs">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{evento.local}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-gray-500 text-xs">
            <Calendar className="w-3 h-3 flex-shrink-0" />
            <span>{dataFmt} às {hora}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroCarousel({ eventos, onSelect }: { eventos: any[]; onSelect: (id: number) => void }) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const destaques = eventos.filter(e => e.status !== "realizado" && e.status !== "cancelado").slice(0, 8);
  if (destaques.length === 0) return null;

  const next = () => setCurrent(c => (c + 1) % destaques.length);
  const prev = () => setCurrent(c => (c - 1 + destaques.length) % destaques.length);

  useEffect(() => {
    timerRef.current = setInterval(next, 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [destaques.length]);

  const ev = destaques[current];
  const data = new Date(ev.data_inicio);
  const dataFmt = format(data, "dd/MM", { locale: ptBR });
  const hora = ev.hora_inicio || format(data, "HH:mm");

  return (
    <div className="w-full relative overflow-hidden bg-black" style={{ aspectRatio: "16/9", maxHeight: "360px" }}>
      {/* Slides */}
      <div className="relative w-full h-full">
        {destaques.map((slide, idx) => (
          <div
            key={slide.id}
            className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: idx === current ? 1 : 0, zIndex: idx === current ? 1 : 0 }}
          >
            {slide.banner_url ? (
              <img
                src={slide.banner_url}
                alt={slide.titulo}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
                <span className="text-7xl">🎉</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent z-10 pointer-events-none" />

      {/* Info na base */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20 p-4 sm:p-6 text-white cursor-pointer"
        onClick={() => onSelect(ev.id)}
      >
        <h2 className="font-bold text-lg sm:text-2xl leading-tight mb-1 line-clamp-2 drop-shadow">{ev.titulo}</h2>
        <div className="flex flex-wrap gap-x-4 text-white/80 text-xs sm:text-sm">
          {ev.local && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />{ev.local}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />{dataFmt} às {hora}
          </span>
        </div>
      </div>

      {/* Setas */}
      {destaques.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition-all"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition-all"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </>
      )}

      {/* Dots */}
      {destaques.length > 1 && (
        <div className="absolute bottom-3 right-4 z-20 flex gap-1.5">
          {destaques.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="rounded-full transition-all"
              style={{
                width: i === current ? 16 : 6,
                height: 6,
                backgroundColor: i === current ? BRAND : "rgba(255,255,255,0.5)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function EventosHome() {
  const [, navigate] = useLocation();
  const [busca, setBusca] = useState("");
  const [catSelecionada, setCatSelecionada] = useState("todos");
  const [showLogin, setShowLogin] = useState(false);
  const [loginRedirect, setLoginRedirect] = useState<string | null>(null);
  const { user, isLoggedIn, logout } = usePortalAuth();

  const { data: eventos = [], isLoading, isError, refetch } = useQuery<any[]>({
    queryKey: ["/api/eventos-grito"],
    queryFn: async () => {
      const r = await fetch("/api/eventos-grito");
      if (!r.ok) throw new Error("Erro ao carregar eventos");
      return r.json();
    },
  });

  const eventosFiltrados = eventos.filter(e => {
    const matchCat = catSelecionada === "todos" || e.categoria === catSelecionada;
    const matchBusca = !busca || e.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      (e.local || "").toLowerCase().includes(busca.toLowerCase());
    return matchCat && matchBusca;
  });

  const disponíveis = eventosFiltrados.filter(e => e.status === "disponivel" || e.status === "ativo");
  const emBreve = eventosFiltrados.filter(e => e.status === "em_breve");

  const iniciais = user ? user.nome.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase() : "";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 h-16 sm:h-18">
            {/* Logo */}
            <img src={logoPath} alt="Clube do Grito" className="h-12 sm:h-13 object-contain flex-shrink-0 rounded-full" />

            {/* Barra de busca no header (desktop) */}
            <div className="flex-1 max-w-lg hidden sm:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar eventos..."
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-full text-sm outline-none focus:bg-white focus:ring-2 transition-colors text-gray-800 placeholder-gray-400"
                  style={{ focusRingColor: GREEN } as any}
                />
              </div>
            </div>

            {/* Ações à direita */}
            <div className="flex items-center gap-2 ml-auto">
              {isLoggedIn ? (
                <>
                  <button
                    onClick={() => navigate("/eventos/perfil")}
                    className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full border transition-colors hover:bg-gray-50"
                    style={{ color: GREEN, borderColor: GREEN }}
                  >
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: GREEN }}>
                      {iniciais}
                    </div>
                    <span className="hidden sm:inline">{user!.nome.split(" ")[0]}</span>
                  </button>
                  <button
                    onClick={logout}
                    className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Sair</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setLoginRedirect("/eventos/perfil"); setShowLogin(true); }}
                    className="hidden sm:flex items-center gap-1.5 text-sm font-semibold px-4 py-1.5 rounded-full text-white transition-colors"
                    style={{ backgroundColor: GREEN }}
                  >
                    <Ticket className="w-4 h-4" />
                    Ingressos
                  </button>
                  <button
                    onClick={() => { setLoginRedirect(null); setShowLogin(true); }}
                    className="flex items-center justify-center w-9 h-9 rounded-full border-2 transition-colors hover:bg-gray-50"
                    style={{ borderColor: GREEN, color: GREEN }}
                    title="Entrar"
                  >
                    <UserCircle className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Busca mobile */}
          <div className="pb-2 sm:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar eventos..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-full text-sm outline-none focus:bg-white transition-colors text-gray-800 placeholder-gray-400"
              />
            </div>
          </div>
        </div>
        {/* Linha vermelha separadora */}
        <div className="h-1" style={{ backgroundColor: "#a90302" }} />
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: BRAND, borderTopColor: "transparent" }} />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
          <p className="text-gray-600 font-medium text-lg">Não foi possível carregar os eventos</p>
          <button onClick={() => refetch()} className="px-5 py-2 rounded-full text-white text-sm font-semibold" style={{ backgroundColor: GREEN }}>
            Tentar novamente
          </button>
        </div>
      ) : (
        <>
          {!busca && catSelecionada === "todos" && (
            <HeroCarousel eventos={eventos} onSelect={id => navigate(`/eventos/${id}`)} />
          )}

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Categorias */}
            <div className="border-b border-gray-200">
              <div className="flex w-full gap-1 py-3">
                {CATEGORIAS.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setCatSelecionada(cat.id)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                      catSelecionada === cat.id
                        ? "text-gray-900 shadow-sm"
                        : "bg-white text-gray-600 border border-gray-200 hover:text-gray-900"
                    }`}
                    style={catSelecionada === cat.id ? { backgroundColor: YELLOW } : {}}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {disponíveis.length > 0 && (
              <section className="pt-6 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-900 text-xl flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: YELLOW }} />
                    Disponíveis agora
                  </h2>
                  <span className="text-sm font-medium" style={{ color: GREEN }}>
                    {disponíveis.length} evento{disponíveis.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {disponíveis.map(ev => (
                    <EventCard key={ev.id} evento={ev} onClick={() => navigate(`/eventos/${ev.id}`)} />
                  ))}
                </div>
              </section>
            )}

            {emBreve.length > 0 && (
              <section className="pt-4 pb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-900 text-xl flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: YELLOW }} />
                    Em breve
                  </h2>
                  <span className="text-sm font-medium" style={{ color: GREEN }}>
                    {emBreve.length} evento{emBreve.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {emBreve.map(ev => (
                    <EventCard key={ev.id} evento={ev} onClick={() => navigate(`/eventos/${ev.id}`)} />
                  ))}
                </div>
              </section>
            )}

            {eventosFiltrados.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <p className="text-gray-500 font-medium text-lg">Nenhum evento encontrado</p>
                <p className="text-gray-400 text-sm mt-1">
                  {busca ? "Tente uma busca diferente" : "Em breve novos eventos!"}
                </p>
              </div>
            )}
          </div>
        </>
      )}

      <footer className="bg-white border-t mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-gray-400">
          <p className="font-medium text-gray-500">Instituto O Grito</p>
          <p className="mt-0.5">Clube do Grito — Eventos</p>
        </div>
      </footer>

      {/* Modal de login */}
      {showLogin && (
        <LoginModal
          onClose={() => { setShowLogin(false); setLoginRedirect(null); }}
          onSuccess={() => navigate(loginRedirect || "/eventos")}
        />
      )}
    </div>
  );
}
