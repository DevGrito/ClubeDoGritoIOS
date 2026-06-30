import { useEffect, useRef, useState, useCallback } from "react";
import { X, Camera, CheckCircle2, AlertCircle, Loader2, UserX, ScanFace, ImageOff, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AlunoFoto {
  id: number | string;
  cpf: string;
  nome: string;
  fotoUrl: string | null;
}

interface PresencaRegistrada {
  cpf: string;
  nome: string;
  hora: string;
}

export type { PresencaRegistrada };

interface Props {
  turmaId: string;
  tipo: "inclusao" | "pec";
  data: string;
  onClose: () => void;
  onFinalize?: () => void;
  onPresencaRegistrada?: (cpf: string, nome: string) => void;
  /** Quando true, não grava presenças no banco — apenas acumula localmente */
  modoLocal?: boolean;
  /** Chamado ao clicar em Finalizar no modo local, com a lista de presenças reconhecidas */
  onFinalizeComPresencas?: (presencas: PresencaRegistrada[]) => void;
  finalizeButtonLabel?: string;
  /** Impede fechar pelo X sem finalizar (ex.: tablet na porta da sala) */
  bloquearFechar?: boolean;
}

type Status =
  | "carregando_modelos"
  | "carregando_fotos"
  | "aguardando_camera"
  | "scanning"
  | "sem_camera"
  | "sem_foto"
  | "erro";

// Estado do rosto atual detectado na câmera
type FaceState =
  | null                                                              // nenhum rosto na câmera
  | { tipo: "desconhecido" }                                         // rosto detectado mas não cadastrado
  | { tipo: "registrado";      cpf: string; nome: string }          // presença registrada com sucesso
  | { tipo: "ja_registrado";   cpf: string; nome: string }          // rosto reconhecido, presença já havia sido registrada
  | { tipo: "erro_registro";   cpf: string; nome: string };         // reconhecido mas registro falhou

let faceApiLoaded = false;

function playBeep(type: "success" | "error") {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);

    if (type === "success") {
      const harmonics = [523, 784];
      harmonics.forEach((freq) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        oscGain.gain.setValueAtTime(0, ctx.currentTime);
        oscGain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.04);
        oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
        osc.connect(oscGain);
        oscGain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.46);
      });
    } else {
      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.setValueAtTime(120, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.setValueAtTime(0.4, ctx.currentTime + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.connect(gain);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.23);
    }

    setTimeout(() => ctx.close(), 800);
  } catch {}
}

export default function ScannerPresencaModal({
  turmaId,
  tipo,
  data,
  onClose,
  onFinalize,
  onPresencaRegistrada,
  modoLocal = false,
  onFinalizeComPresencas,
  finalizeButtonLabel,
  bloquearFechar = false,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const loopRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);
  const matcherRef = useRef<any>(null);
  const registradosRef = useRef<Set<string>>(new Set());
  const faceApiRef = useRef<any>(null);
  const onPresencaRegistradaRef = useRef(onPresencaRegistrada);
  onPresencaRegistradaRef.current = onPresencaRegistrada;

  // Chave do último rosto detectado — evita re-renderizações e piscar
  // Valor: cpf para rosto conhecido, "unknown" para desconhecido, null para nenhum rosto
  const lastDetectionKeyRef = useRef<string | null>(null);

  const [status, setStatus] = useState<Status>("carregando_modelos");
  const [statusMsg, setStatusMsg] = useState("");
  const [presencas, setPresencas] = useState<PresencaRegistrada[]>([]);
  const [semFoto, setSemFoto] = useState(0);
  const [totalAlunos, setTotalAlunos] = useState(0);
  const [comFotoCount, setComFotoCount] = useState(0);
  const [faceState, setFaceState] = useState<FaceState>(null);
  const [loadProgress, setLoadProgress] = useState(0);
  const [exitBlockedMsg, setExitBlockedMsg] = useState("");

  // Retorna: "novo" | "ja_registrado" | "erro"
  const registrarPresenca = useCallback(async (cpf: string, nome: string): Promise<"novo" | "ja_registrado" | "erro"> => {
    const cpfNorm = cpf.replace(/\D/g, "");
    if (registradosRef.current.has(cpfNorm)) return "ja_registrado";
    registradosRef.current.add(cpfNorm);

    if (modoLocal) {
      const hora = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      setPresencas((prev) => [{ cpf: cpfNorm, nome, hora }, ...prev]);
      onPresencaRegistradaRef.current?.(cpfNorm, nome);
      return "novo";
    }

    try {
      const res = await fetch("/api/scanner-presenca/registrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tipo, turmaId, cpf: cpfNorm, data }),
      });
      if (!res.ok) {
        registradosRef.current.delete(cpfNorm);
        return "erro";
      }
      const hora = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      setPresencas((prev) => [{ cpf: cpfNorm, nome, hora }, ...prev]);
      onPresencaRegistradaRef.current?.(cpfNorm, nome);
      return "novo";
    } catch {
      registradosRef.current.delete(cpfNorm);
      return "erro";
    }
  }, [tipo, turmaId, data, modoLocal]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        setStatus("carregando_modelos");
        setStatusMsg("");
        setLoadProgress(10);

        const faceApiModule = await import("@vladmandic/face-api");
        const faceApi = faceApiModule;
        faceApiRef.current = faceApi;

        if (!faceApiLoaded) {
          setLoadProgress(20);
          const MODEL_URL = "/models";
          await faceApi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
          setLoadProgress(50);
          await faceApi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL);
          setLoadProgress(75);
          await faceApi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
          setLoadProgress(95);
          faceApiLoaded = true;
        }
        setLoadProgress(100);

        if (cancelled) return;

        setStatus("carregando_fotos");
        setStatusMsg("Carregando fotos dos alunos da turma...");

        const res = await fetch(`/api/scanner-presenca/fotos?tipo=${tipo}&turmaId=${turmaId}`, {
          credentials: "include",
        });
        const alunos: AlunoFoto[] = await res.json();
        setTotalAlunos(alunos.length);

        const comFoto = alunos.filter((a) => a.fotoUrl);
        setSemFoto(alunos.length - comFoto.length);
        setComFotoCount(comFoto.length);

        if (cancelled) return;

        if (comFoto.length === 0) {
          setStatus("sem_foto");
          setStatusMsg(
            alunos.length === 0
              ? "Nenhum aluno encontrado nesta turma."
              : `${alunos.length} aluno(s) na turma, mas nenhum possui foto cadastrada. Acesse o cadastro de cada aluno e adicione uma foto para usar o scanner.`
          );
          return;
        }

        setStatusMsg(`Processando fotos (${comFoto.length} aluno(s))...`);

        const labeledDescriptors: any[] = [];
        for (const aluno of comFoto) {
          if (cancelled) return;
          try {
            const img = await faceApi.fetchImage(aluno.fotoUrl!);
            const detection = await faceApi
              .detectSingleFace(img, new faceApi.TinyFaceDetectorOptions())
              .withFaceLandmarks(true)
              .withFaceDescriptor();

            if (detection) {
              labeledDescriptors.push(
                new faceApi.LabeledFaceDescriptors(`${aluno.cpf}||${aluno.nome}`, [detection.descriptor])
              );
            }
          } catch {
            // foto falhou ou sem rosto detectável
          }
        }

        if (cancelled) return;

        if (labeledDescriptors.length === 0) {
          setStatus("sem_foto");
          setStatusMsg(
            `${comFoto.length} foto(s) encontrada(s), mas nenhum rosto foi detectado nas imagens. Verifique se as fotos mostram o rosto claramente.`
          );
          return;
        }

        matcherRef.current = new faceApi.FaceMatcher(labeledDescriptors, 0.55);

        if (!modoLocal) {
          // Pré-carrega CPFs já registrados hoje para não duplicar ao reabrir o scanner
          try {
            const presRes = await fetch(
              `/api/scanner-presenca/presentes?tipo=${tipo}&turmaId=${turmaId}&data=${data}`,
              { credentials: "include" }
            );
            if (presRes.ok) {
              const presData = await presRes.json();
              if (Array.isArray(presData.cpfs)) {
                presData.cpfs.forEach((c: string) => registradosRef.current.add(c.replace(/\D/g, "")));
              }
            }
          } catch {
            // silencioso — não impede o scanner de funcionar
          }
        }

        if (cancelled) return;

        setStatus("aguardando_camera");
        setStatusMsg("Iniciando câmera...");

        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
          });
        } catch {
          setStatus("sem_camera");
          setStatusMsg("Permissão de câmera negada ou câmera não encontrada.");
          return;
        }

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setStatus("scanning");
        setStatusMsg(`${labeledDescriptors.length} aluno(s) no banco de rostos.`);

        const faceApi2 = faceApiRef.current;

        async function detect() {
          if (!videoRef.current || !canvasRef.current || cancelled) return;
          const video = videoRef.current;
          const canvas = canvasRef.current;
          const displaySize = { width: video.videoWidth || 640, height: video.videoHeight || 480 };
          faceApi2.matchDimensions(canvas, displaySize);

          const detections = await faceApi2
            .detectAllFaces(video, new faceApi2.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
            .withFaceLandmarks(true)
            .withFaceDescriptors();

          const ctx = canvas.getContext("2d");
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);

          const resized = faceApi2.resizeResults(detections, displaySize);

          // ── Nenhum rosto na câmera ──────────────────────────────────────
          if (resized.length === 0) {
            if (lastDetectionKeyRef.current !== null) {
              lastDetectionKeyRef.current = null;
              setFaceState(null);
            }
            if (!cancelled) loopRef.current = requestAnimationFrame(() => detect());
            return;
          }

          // ── Processa o primeiro rosto encontrado ────────────────────────
          // Prioriza rostos reconhecidos sobre desconhecidos
          let bestMatch: { cpf: string; nome: string; box: any } | null = null;
          let hasUnknown = false;

          for (const d of resized) {
            const match = matcherRef.current?.findBestMatch(d.descriptor);
            if (match && match.label !== "unknown") {
              const [cpf, nome] = match.label.split("||");
              if (!bestMatch) bestMatch = { cpf, nome, box: d.detection.box };
              // Desenha caixa verde com nome
              if (ctx) {
                ctx.strokeStyle = "#22c55e";
                ctx.lineWidth = 3;
                const { x, y, width, height } = d.detection.box;
                ctx.strokeRect(x, y, width, height);
                ctx.fillStyle = "rgba(34,197,94,0.85)";
                ctx.fillRect(x, y - 22, Math.min(width, 220), 22);
                ctx.fillStyle = "#fff";
                ctx.font = "bold 13px sans-serif";
                ctx.fillText(nome.slice(0, 28), x + 4, y - 6);
              }
            } else {
              hasUnknown = true;
              // Desenha caixa vermelha com label
              if (ctx) {
                ctx.strokeStyle = "#ef4444";
                ctx.lineWidth = 2;
                const { x, y, width, height } = d.detection.box;
                ctx.strokeRect(x, y, width, height);
                ctx.fillStyle = "rgba(239,68,68,0.85)";
                ctx.fillRect(x, y - 22, Math.min(width, 220), 22);
                ctx.fillStyle = "#fff";
                ctx.font = "bold 12px sans-serif";
                ctx.fillText("Não cadastrado", x + 4, y - 6);
              }
            }
          }

          // ── Rosto reconhecido ───────────────────────────────────────────
          if (bestMatch) {
            const { cpf, nome } = bestMatch;
            // Só atualiza estado se o rosto mudou
            if (lastDetectionKeyRef.current !== cpf) {
              lastDetectionKeyRef.current = cpf;
              const resultado = await registrarPresenca(cpf, nome);
              if (resultado === "novo") {
                setFaceState({ tipo: "registrado", cpf, nome });
                playBeep("success");
              } else if (resultado === "ja_registrado") {
                setFaceState({ tipo: "ja_registrado", cpf, nome });
                playBeep("success");
              } else {
                setFaceState({ tipo: "erro_registro", cpf, nome });
              }
            }
          // ── Rosto desconhecido (sem nenhum reconhecido no frame) ────────
          } else if (hasUnknown) {
            if (lastDetectionKeyRef.current !== "unknown") {
              lastDetectionKeyRef.current = "unknown";
              setFaceState({ tipo: "desconhecido" });
              playBeep("error");
            }
          }

          if (!cancelled) loopRef.current = requestAnimationFrame(() => detect());
        }

        detect();
      } catch (e: any) {
        if (!cancelled) {
          setStatus("erro");
          setStatusMsg(`Erro ao iniciar: ${e?.message || "Falha desconhecida"}`);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      if (loopRef.current) cancelAnimationFrame(loopRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [turmaId, tipo, registrarPresenca, modoLocal, data]);

  const stopCamera = () => {
    if (loopRef.current) cancelAnimationFrame(loopRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
  };

  const handleClose = (fromX = false) => {
    if ((bloquearFechar || modoLocal) && fromX) {
      setExitBlockedMsg("Finalize a chamada antes de sair.");
      return;
    }
    stopCamera();
    onFinalize?.();
    onClose();
  };

  const handleFinalize = () => {
    stopCamera();
    if (modoLocal && onFinalizeComPresencas) {
      onFinalizeComPresencas(presencas);
      return;
    }
    onFinalize?.();
    onClose();
  };

  const finalizeLabel = finalizeButtonLabel || (modoLocal ? "Finalizar chamada" : "Finalizar");

  const isLoading = status === "carregando_modelos" || status === "carregando_fotos" || status === "aguardando_camera";

  // Banner inferior baseado no faceState
  function renderFaceBanner() {
    if (!faceState) return null;

    if (faceState.tipo === "desconhecido") {
      return (
        <div className="absolute bottom-3 left-3 right-3 bg-red-600/95 rounded-lg px-4 py-2.5 flex items-center gap-2 pointer-events-none">
          <UserX className="w-4 h-4 text-white shrink-0" />
          <span className="text-white text-sm font-bold">Rosto não cadastrado no sistema</span>
        </div>
      );
    }

    if (faceState.tipo === "registrado") {
      return (
        <div className="absolute bottom-3 left-3 right-3 bg-green-600/95 rounded-lg px-4 py-2.5 flex items-center gap-2 pointer-events-none">
          <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-white text-sm font-bold truncate">{faceState.nome}</span>
            <span className="text-green-100 text-xs">Presença registrada com sucesso</span>
          </div>
        </div>
      );
    }

    if (faceState.tipo === "ja_registrado") {
      return (
        <div className="absolute bottom-3 left-3 right-3 bg-green-700/95 rounded-lg px-4 py-2.5 flex items-center gap-2 pointer-events-none">
          <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-white text-sm font-bold truncate">{faceState.nome}</span>
            <span className="text-green-200 text-xs">Presença já registrada</span>
          </div>
        </div>
      );
    }

    if (faceState.tipo === "erro_registro") {
      return (
        <div className="absolute bottom-3 left-3 right-3 bg-amber-600/95 rounded-lg px-4 py-2.5 flex items-center gap-2 pointer-events-none">
          <ShieldAlert className="w-4 h-4 text-white shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-white text-sm font-bold truncate">{faceState.nome}</span>
            <span className="text-amber-100 text-xs">Rosto reconhecido, mas presença não registrada</span>
          </div>
        </div>
      );
    }

    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-2xl flex flex-col overflow-hidden shadow-2xl" style={{ maxHeight: "90vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-2">
            <ScanFace className="w-5 h-5 text-yellow-400" />
            <h2 className="text-white font-bold text-lg">Chamada O Grito</h2>
          </div>
          <button
            onClick={() => handleClose(true)}
            className={`p-2 rounded-lg transition-colors ${
              bloquearFechar || modoLocal
                ? "text-slate-500 cursor-not-allowed opacity-60"
                : "hover:bg-slate-700 text-slate-400 hover:text-white"
            }`}
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {exitBlockedMsg && (
          <div className="px-5 py-2.5 bg-amber-500/15 border-b border-amber-500/30 text-amber-200 text-sm text-center shrink-0">
            {exitBlockedMsg}
          </div>
        )}

        <div className="flex flex-col md:flex-row flex-1 min-h-0" style={{ minHeight: 300 }}>
          {/* Camera / Status area */}
          <div className="relative flex-1 bg-black flex items-center justify-center" style={{ minHeight: 260 }}>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              muted
              playsInline
              style={{ display: status === "scanning" ? "block" : "none" }}
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ display: status === "scanning" ? "block" : "none" }}
            />

            {/* Loading state */}
            {isLoading && (
              <div className="flex flex-col items-center gap-4 p-8 text-center w-full">
                <Loader2 className="w-14 h-14 text-yellow-400 animate-spin" />
                <p className="text-white text-base font-semibold">Iniciando scanner...</p>
                {statusMsg ? (
                  <p className="text-slate-400 text-sm max-w-xs">{statusMsg}</p>
                ) : null}
                {status === "carregando_modelos" && loadProgress > 0 && (
                  <div className="w-full max-w-xs bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${loadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* No photo state */}
            {status === "sem_foto" && (
              <div className="flex flex-col items-center gap-4 p-8 text-center w-full">
                <ImageOff className="w-14 h-14 text-amber-400" />
                <p className="text-white text-base font-semibold">Scanner não disponível</p>
                <p className="text-slate-300 text-sm max-w-xs leading-relaxed">{statusMsg}</p>
                {totalAlunos > 0 && (
                  <div className="bg-slate-800 rounded-lg px-4 py-3 text-sm text-left w-full max-w-xs">
                    <p className="text-slate-300">
                      <span className="text-white font-semibold">{totalAlunos}</span> aluno(s) na turma
                    </p>
                    <p className="text-slate-400 mt-1">
                      <span className="text-amber-400 font-semibold">{comFotoCount}</span> com foto cadastrada
                    </p>
                  </div>
                )}
                <Button onClick={handleClose} className="bg-yellow-400 hover:bg-yellow-300 text-black font-semibold mt-2">
                  Fechar
                </Button>
              </div>
            )}

            {/* No camera state */}
            {status === "sem_camera" && (
              <div className="flex flex-col items-center gap-4 p-8 text-center w-full">
                <Camera className="w-14 h-14 text-red-400" />
                <p className="text-white text-base font-semibold">Câmera indisponível</p>
                <p className="text-slate-400 text-sm max-w-xs">{statusMsg}</p>
                <Button onClick={handleClose} className="bg-yellow-400 hover:bg-yellow-300 text-black font-semibold mt-2">
                  Fechar
                </Button>
              </div>
            )}

            {/* Error state */}
            {status === "erro" && (
              <div className="flex flex-col items-center gap-4 p-8 text-center w-full">
                <AlertCircle className="w-14 h-14 text-red-400" />
                <p className="text-white text-base font-semibold">Erro no scanner</p>
                <p className="text-slate-400 text-sm max-w-xs">{statusMsg}</p>
                <Button onClick={handleClose} className="bg-yellow-400 hover:bg-yellow-300 text-black font-semibold mt-2">
                  Fechar
                </Button>
              </div>
            )}

            {/* Scanning overlays */}
            {status === "scanning" && (
              <>
                <div className="absolute top-3 left-3 right-3 flex justify-between pointer-events-none">
                  <span className="bg-yellow-400 text-black text-xs px-2.5 py-1 rounded-full font-semibold">
                    {presencas.length} presença{presencas.length !== 1 ? "s" : ""}
                  </span>
                  {semFoto > 0 && (
                    <span className="bg-slate-800/90 text-slate-300 text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                      <UserX className="w-3 h-3" />
                      {semFoto} sem foto
                    </span>
                  )}
                </div>
                {renderFaceBanner()}
              </>
            )}
          </div>

          {/* Presença list */}
          <div className="w-full md:w-56 border-t md:border-t-0 md:border-l border-slate-700 flex flex-col shrink-0">
            <div className="px-4 py-3 border-b border-slate-700 shrink-0">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest">Registradas</p>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1" style={{ maxHeight: 260 }}>
              {presencas.length === 0 ? (
                <p className="text-slate-600 text-xs text-center py-6">Nenhuma ainda</p>
              ) : (
                presencas.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate">{p.nome}</p>
                      <p className="text-slate-500 text-[10px]">{p.hora}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-3 border-t border-slate-700 shrink-0">
              <Button onClick={handleFinalize} className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-semibold text-sm">
                {finalizeLabel} {presencas.length > 0 ? `(${presencas.length})` : ""}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
