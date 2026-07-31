import { useEffect, useRef, useState, useCallback } from "react";
import {
  X,
  Camera,
  CheckCircle2,
  AlertCircle,
  Loader2,
  UserX,
  ScanFace,
  ImageOff,
  ShieldAlert,
  Trash2,
  Pencil,
  RotateCcw,
} from "lucide-react";
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
  onPresencaRemovida?: (cpf: string) => void;
  /** Quando true, não grava presenças no banco — apenas acumula localmente */
  modoLocal?: boolean;
  /** Chamado ao clicar em Finalizar no modo local, com a lista de presenças reconhecidas */
  onFinalizeComPresencas?: (presencas: PresencaRegistrada[]) => void;
  /** Abre lista editável (presenças/faltas) com o que o facial já marcou */
  onEditarComPresencas?: (presencas: PresencaRegistrada[]) => void;
  /** Limpa a chamada e reinicia o scanner (pai deve remountar o modal) */
  onRefazer?: () => void;
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

type FaceState =
  | null
  | { tipo: "desconhecido" }
  | { tipo: "confirmacao"; cpf: string; nome: string; fotoUrl: string | null; distance: number; snapshotUrl: string | null }
  | { tipo: "registrado"; cpf: string; nome: string }
  | { tipo: "ja_registrado"; cpf: string; nome: string }
  | { tipo: "erro_registro"; cpf: string; nome: string };

/** Distância euclidiana máxima para aceitar match (menor = mais restrito). */
const MATCH_THRESHOLD = 0.36;
/** Frames consecutivos do mesmo CPF antes de pedir confirmação. */
const STABLE_FRAMES = 5;
/** Diferença mínima entre 1º e 2º colocado; se menor, rejeita por ambiguidade. */
const MIN_MARGIN = 0.1;
/** Delay antes de habilitar o botão Confirmar (ms). */
const CONFIRM_DELAY_MS = 1800;

/**
 * Tentativas mais permissivas só na carga das fotos cadastrais
 * (câmera ao vivo continua com opções mais rígidas).
 */
const CADASTRO_DETECT_TRIES = [
  { inputSize: 512, scoreThreshold: 0.35 },
  { inputSize: 608, scoreThreshold: 0.25 },
  { inputSize: 416, scoreThreshold: 0.2 },
] as const;

/** Configuração mais sensível para câmeras frontais de tablet. */
const LIVE_DETECT_OPTIONS = { inputSize: 416, scoreThreshold: 0.3 } as const;
/** readyState mínimo com frame disponível (HAVE_CURRENT_DATA). */
const VIDEO_COM_FRAME = 2;

let faceApiLoaded = false;

function mimeFromUrlOrHeader(url: string, headerType: string, blobType: string): string {
  const header = (headerType || "").split(";")[0].trim().toLowerCase();
  if (header.startsWith("image/")) return header;
  if ((blobType || "").toLowerCase().startsWith("image/")) return blobType;
  const lower = url.toLowerCase();
  if (lower.includes(".png")) return "image/png";
  if (lower.includes(".webp")) return "image/webp";
  if (lower.includes(".gif")) return "image/gif";
  return "image/jpeg";
}

/** Carrega foto com cookie de sessão e Content-Type forçado para image/*. */
async function loadCadastroImage(
  url: string
): Promise<{ img: HTMLImageElement; revoke: () => void }> {
  const res = await fetch(url, { credentials: "include", cache: "no-store" });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const headerType = res.headers.get("content-type") || "";
  const blob = await res.blob();
  const mime = mimeFromUrlOrHeader(url, headerType, blob.type);
  if (!mime.startsWith("image/")) {
    throw new Error(`Content-Type inválido: ${headerType || blob.type || "vazio"}`);
  }
  const typed = blob.type === mime ? blob : new Blob([blob], { type: mime });
  const objectUrl = URL.createObjectURL(typed);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Imagem corrompida ou formato não suportado"));
    el.src = objectUrl;
  });
  return { img, revoke: () => URL.revokeObjectURL(objectUrl) };
}

async function detectCadastroFace(faceApi: any, img: HTMLImageElement) {
  for (const opts of CADASTRO_DETECT_TRIES) {
    const detection = await faceApi
      .detectSingleFace(img, new faceApi.TinyFaceDetectorOptions(opts))
      .withFaceLandmarks(true)
      .withFaceDescriptor();
    if (detection) return detection;
  }
  return null;
}

function motivoFalhaCarga(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err || "");
  if (msg.startsWith("HTTP ")) return `Foto não carregou (${msg})`;
  if (msg.includes("Content-Type")) return msg;
  if (msg.includes("corrompida") || msg.includes("formato")) return msg;
  return "Foto não carregou ou inválida";
}

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

function findBestMatchWithMargin(
  matcher: any,
  descriptor: Float32Array | number[]
): { label: string; distance: number } | null {
  if (!matcher?.labeledDescriptors?.length) return null;

  const distances: { label: string; distance: number }[] = [];
  for (const ld of matcher.labeledDescriptors) {
    for (const desc of ld.descriptors) {
      const distance = matcher.distanceFunction
        ? matcher.distanceFunction(descriptor, desc)
        : euclideanDistance(descriptor, desc);
      distances.push({ label: ld.label, distance });
    }
  }
  if (distances.length === 0) return null;

  distances.sort((a, b) => a.distance - b.distance);
  const best = distances[0];
  if (best.distance > MATCH_THRESHOLD) return null;

  const second = distances.find((d) => d.label !== best.label);
  if (second && second.distance - best.distance < MIN_MARGIN) {
    return null; // ambíguo demais
  }
  return best;
}

function euclideanDistance(a: Float32Array | number[], b: Float32Array | number[]) {
  let sum = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const d = Number(a[i]) - Number(b[i]);
    sum += d * d;
  }
  return Math.sqrt(sum);
}

export default function ScannerPresencaModal({
  turmaId,
  tipo,
  data,
  onClose,
  onFinalize,
  onPresencaRegistrada,
  onPresencaRemovida,
  modoLocal = false,
  onFinalizeComPresencas,
  onEditarComPresencas,
  onRefazer,
  finalizeButtonLabel,
  bloquearFechar = false,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const loopRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);
  const matcherRef = useRef<any>(null);
  const registradosRef = useRef<Set<string>>(new Set());
  const rejeitadosRef = useRef<Map<string, number>>(new Map());
  const fotoByCpfRef = useRef<Map<string, string | null>>(new Map());
  const stableRef = useRef<{ cpf: string; count: number }>({ cpf: "", count: 0 });
  const pendingConfirmRef = useRef<{ cpf: string; nome: string } | null>(null);
  const faceApiRef = useRef<any>(null);
  const onPresencaRegistradaRef = useRef(onPresencaRegistrada);
  const onPresencaRemovidaRef = useRef(onPresencaRemovida);
  onPresencaRegistradaRef.current = onPresencaRegistrada;
  onPresencaRemovidaRef.current = onPresencaRemovida;

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
  const [confirmando, setConfirmando] = useState(false);
  const [removendoCpf, setRemovendoCpf] = useState<string | null>(null);
  const [confirmReady, setConfirmReady] = useState(false);
  const [semImagem, setSemImagem] = useState(false);
  const [showFotoReport, setShowFotoReport] = useState(false);
  const [fotoReport, setFotoReport] = useState<{
    total: number;
    comFoto: number;
    validadas: number;
    falhas: { nome: string; cpf: string; motivo: string }[];
  } | null>(null);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const registrarPresenca = useCallback(
    async (cpf: string, nome: string): Promise<"novo" | "ja_registrado" | "erro"> => {
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
    },
    [tipo, turmaId, data, modoLocal]
  );

  const removerPresenca = useCallback(
    async (cpf: string) => {
      const cpfNorm = cpf.replace(/\D/g, "");
      setRemovendoCpf(cpfNorm);

      if (modoLocal) {
        registradosRef.current.delete(cpfNorm);
        setPresencas((prev) => prev.filter((p) => p.cpf !== cpfNorm));
        onPresencaRemovidaRef.current?.(cpfNorm);
        setRemovendoCpf(null);
        return;
      }

      try {
        const res = await fetch("/api/scanner-presenca/desfazer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ tipo, turmaId, cpf: cpfNorm, data }),
        });
        if (!res.ok) throw new Error("Falha ao desfazer");
        registradosRef.current.delete(cpfNorm);
        setPresencas((prev) => prev.filter((p) => p.cpf !== cpfNorm));
        onPresencaRemovidaRef.current?.(cpfNorm);
      } catch {
        // mantém na lista se falhou
      } finally {
        setRemovendoCpf(null);
      }
    },
    [tipo, turmaId, data, modoLocal]
  );

  const confirmarPresenca = useCallback(async () => {
    const pending = pendingConfirmRef.current;
    if (!pending || confirmando) return;
    setConfirmando(true);
    try {
      const resultado = await registrarPresenca(pending.cpf, pending.nome);
      pendingConfirmRef.current = null;
      if (resultado === "novo") {
        setFaceState({ tipo: "registrado", cpf: pending.cpf, nome: pending.nome });
        playBeep("success");
      } else if (resultado === "ja_registrado") {
        setFaceState({ tipo: "ja_registrado", cpf: pending.cpf, nome: pending.nome });
        playBeep("success");
      } else {
        setFaceState({ tipo: "erro_registro", cpf: pending.cpf, nome: pending.nome });
      }
      lastDetectionKeyRef.current = pending.cpf;
      stableRef.current = { cpf: "", count: 0 };
      setConfirmReady(false);
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    } finally {
      setConfirmando(false);
    }
  }, [confirmando, registrarPresenca]);

  const rejeitarPresenca = useCallback(() => {
    const pending = pendingConfirmRef.current;
    if (pending) {
      rejeitadosRef.current.set(pending.cpf.replace(/\D/g, ""), Date.now() + 8000);
    }
    pendingConfirmRef.current = null;
    stableRef.current = { cpf: "", count: 0 };
    lastDetectionKeyRef.current = null;
    setConfirmReady(false);
    if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    setFaceState(null);
    playBeep("error");
  }, []);

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

        fotoByCpfRef.current.clear();
        for (const a of alunos) {
          fotoByCpfRef.current.set(String(a.cpf).replace(/\D/g, ""), a.fotoUrl);
        }

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
        const falhas: { nome: string; cpf: string; motivo: string }[] = [];
        for (const aluno of comFoto) {
          if (cancelled) return;
          const cpfNorm = String(aluno.cpf).replace(/\D/g, "");
          try {
            const { img, revoke } = await loadCadastroImage(aluno.fotoUrl!);
            let detection: any = null;
            try {
              detection = await detectCadastroFace(faceApi, img);
            } finally {
              revoke();
            }

            if (detection) {
              labeledDescriptors.push(
                new faceApi.LabeledFaceDescriptors(`${cpfNorm}||${aluno.nome}`, [detection.descriptor])
              );
            } else {
              falhas.push({
                nome: aluno.nome,
                cpf: cpfNorm,
                motivo: "Nenhum rosto detectado na foto",
              });
            }
          } catch (err) {
            falhas.push({
              nome: aluno.nome,
              cpf: cpfNorm,
              motivo: motivoFalhaCarga(err),
            });
          }
        }

        if (cancelled) return;

        setFotoReport({
          total: alunos.length,
          comFoto: comFoto.length,
          validadas: labeledDescriptors.length,
          falhas,
        });
        if (falhas.length > 0) setShowFotoReport(true);

        if (labeledDescriptors.length === 0) {
          setStatus("sem_foto");
          setStatusMsg(
            `${comFoto.length} foto(s) encontrada(s), mas nenhum rosto foi detectado nas imagens. Verifique se as fotos mostram o rosto claramente.`
          );
          return;
        }

        matcherRef.current = new faceApi.FaceMatcher(labeledDescriptors, MATCH_THRESHOLD);

        if (!modoLocal) {
          try {
            const presRes = await fetch(
              `/api/scanner-presenca/presentes?tipo=${tipo}&turmaId=${turmaId}&data=${data}`,
              { credentials: "include" }
            );
            if (presRes.ok) {
              const presData = await presRes.json();
              if (Array.isArray(presData.cpfs)) {
                for (const c of presData.cpfs) {
                  registradosRef.current.add(String(c).replace(/\D/g, ""));
                }
              }
            }
          } catch {
            // silencioso
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
        }

        // O <video> só fica visível no status "scanning"; em WebView de tablet um
        // vídeo oculto não decodifica frames, então o play vem depois da troca de status.
        setStatus("scanning");
        setStatusMsg(`${labeledDescriptors.length} aluno(s) no banco de rostos.`);

        const faceApi2 = faceApiRef.current;

        // Sem await: se o play falhar, o loop continua tentando em vez de travar o scanner.
        const iniciarVideo = () => {
          if (cancelled) return;
          videoRef.current
            ?.play()
            .catch((err) => console.warn("[scanner-facial] play() falhou, tentando de novo", err));
        };
        requestAnimationFrame(iniciarVideo);

        let framesSemImagem = 0;

        async function detect() {
          if (!videoRef.current || !canvasRef.current || cancelled) return;

          // Enquanto pede confirmação, não processa novos matches
          if (pendingConfirmRef.current) {
            if (!cancelled) loopRef.current = requestAnimationFrame(() => detect());
            return;
          }

          const video = videoRef.current;
          const canvas = canvasRef.current;
          if (
            video.readyState < VIDEO_COM_FRAME ||
            video.videoWidth === 0 ||
            video.videoHeight === 0
          ) {
            framesSemImagem += 1;
            if (framesSemImagem % 60 === 0) iniciarVideo();
            if (framesSemImagem === 90) setSemImagem(true);
            if (!cancelled) loopRef.current = requestAnimationFrame(() => detect());
            return;
          }
          if (framesSemImagem > 0) {
            framesSemImagem = 0;
            setSemImagem(false);
          }
          const displaySize = { width: video.videoWidth || 640, height: video.videoHeight || 480 };
          faceApi2.matchDimensions(canvas, displaySize);

          let detections: any[];
          try {
            detections = await faceApi2
              .detectAllFaces(video, new faceApi2.TinyFaceDetectorOptions(LIVE_DETECT_OPTIONS))
              .withFaceLandmarks(true)
              .withFaceDescriptors();
          } catch (err) {
            console.warn("[scanner-facial] Falha ao processar frame; tentando novamente", err);
            if (!cancelled) {
              setTimeout(() => {
                if (!cancelled) loopRef.current = requestAnimationFrame(() => detect());
              }, 250);
            }
            return;
          }

          const ctx = canvas.getContext("2d");
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);

          const resized = faceApi2.resizeResults(detections, displaySize);

          if (resized.length === 0) {
            stableRef.current = { cpf: "", count: 0 };
            if (lastDetectionKeyRef.current !== null && lastDetectionKeyRef.current !== "confirmando") {
              lastDetectionKeyRef.current = null;
              setFaceState(null);
            }
            if (!cancelled) loopRef.current = requestAnimationFrame(() => detect());
            return;
          }

          let bestMatch: { cpf: string; nome: string; distance: number; box: any } | null = null;
          let hasUnknown = false;

          for (const d of resized) {
            const match = findBestMatchWithMargin(matcherRef.current, d.descriptor);
            if (match && match.label !== "unknown") {
              const [cpf, nome] = match.label.split("||");
              const cpfNorm = String(cpf).replace(/\D/g, "");
              const rejeitadoAte = rejeitadosRef.current.get(cpfNorm) || 0;
              if (rejeitadoAte > Date.now()) {
                hasUnknown = true;
                if (ctx) {
                  ctx.strokeStyle = "#f59e0b";
                  ctx.lineWidth = 2;
                  const { x, y, width, height } = d.detection.box;
                  ctx.strokeRect(x, y, width, height);
                  ctx.fillStyle = "rgba(245,158,11,0.85)";
                  ctx.fillRect(x, y - 22, Math.min(width, 220), 22);
                  ctx.fillStyle = "#fff";
                  ctx.font = "bold 12px sans-serif";
                  ctx.fillText("Recusado — tente outro", x + 4, y - 6);
                }
                continue;
              }

              if (!bestMatch || match.distance < bestMatch.distance) {
                bestMatch = { cpf: cpfNorm, nome, distance: match.distance, box: d.detection.box };
              }
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
              if (ctx) {
                ctx.strokeStyle = "#ef4444";
                ctx.lineWidth = 2;
                const { x, y, width, height } = d.detection.box;
                ctx.strokeRect(x, y, width, height);
                ctx.fillStyle = "rgba(239,68,68,0.85)";
                ctx.fillRect(x, y - 22, Math.min(width, 220), 22);
                ctx.fillStyle = "#fff";
                ctx.font = "bold 12px sans-serif";
                ctx.fillText("Não identificado", x + 4, y - 6);
              }
            }
          }

          if (bestMatch) {
            const { cpf, nome, distance } = bestMatch;

            if (registradosRef.current.has(cpf)) {
              if (lastDetectionKeyRef.current !== cpf) {
                lastDetectionKeyRef.current = cpf;
                setFaceState({ tipo: "ja_registrado", cpf, nome });
              }
              stableRef.current = { cpf: "", count: 0 };
            } else {
              if (stableRef.current.cpf === cpf) {
                stableRef.current.count += 1;
              } else {
                stableRef.current = { cpf, count: 1 };
              }

              if (stableRef.current.count >= STABLE_FRAMES) {
                let snapshotUrl: string | null = null;
                try {
                  const snap = document.createElement("canvas");
                  snap.width = video.videoWidth || 320;
                  snap.height = video.videoHeight || 240;
                  const sctx = snap.getContext("2d");
                  if (sctx && video.videoWidth) {
                    sctx.drawImage(video, 0, 0, snap.width, snap.height);
                    snapshotUrl = snap.toDataURL("image/jpeg", 0.7);
                  }
                } catch {}

                pendingConfirmRef.current = { cpf, nome };
                lastDetectionKeyRef.current = "confirmando";
                setConfirmReady(false);
                if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
                confirmTimerRef.current = setTimeout(() => setConfirmReady(true), CONFIRM_DELAY_MS);
                setFaceState({
                  tipo: "confirmacao",
                  cpf,
                  nome,
                  fotoUrl: fotoByCpfRef.current.get(cpf) || null,
                  distance,
                  snapshotUrl,
                });
                playBeep("success");
                stableRef.current = { cpf: "", count: 0 };
              }
            }
          } else if (hasUnknown) {
            stableRef.current = { cpf: "", count: 0 };
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
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [turmaId, tipo, modoLocal, data]);

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

  const handleEditar = () => {
    stopCamera();
    onEditarComPresencas?.(presencas);
  };

  const handleRefazer = () => {
    stopCamera();
    onRefazer?.();
  };

  const temAcoesExtras = !!(onEditarComPresencas || onRefazer);
  const finalizeLabel =
    finalizeButtonLabel ||
    (temAcoesExtras ? "Finalizar" : modoLocal ? "Finalizar chamada" : "Finalizar");
  const isLoading =
    status === "carregando_modelos" || status === "carregando_fotos" || status === "aguardando_camera";

  function renderFaceBanner() {
    if (!faceState) return null;

    if (faceState.tipo === "confirmacao") {
      return (
        <div className="absolute bottom-3 left-3 right-3 bg-slate-900/95 border border-yellow-400/60 rounded-xl p-3 pointer-events-auto shadow-xl">
          <p className="text-yellow-300 text-[10px] font-bold uppercase tracking-wide mb-2 text-center">
            Confira se é a mesma pessoa
          </p>
          <div className="flex items-stretch gap-2 mb-3">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-400 mb-1 text-center">Câmera agora</p>
              {faceState.snapshotUrl ? (
                <img
                  src={faceState.snapshotUrl}
                  alt="Captura"
                  className="w-full h-20 rounded-lg object-cover border border-slate-600"
                />
              ) : (
                <div className="w-full h-20 rounded-lg bg-slate-800 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-slate-500" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-400 mb-1 text-center">Foto cadastrada</p>
              {faceState.fotoUrl ? (
                <img
                  src={faceState.fotoUrl}
                  alt={faceState.nome}
                  className="w-full h-20 rounded-lg object-cover border-2 border-yellow-400"
                />
              ) : (
                <div className="w-full h-20 rounded-lg bg-slate-700 flex items-center justify-center border border-slate-600">
                  <ScanFace className="w-6 h-6 text-yellow-400" />
                </div>
              )}
            </div>
          </div>
          <div className="text-center mb-3">
            <p className="text-white text-sm font-bold truncate">{faceState.nome}</p>
            <p className="text-slate-400 text-xs">
              CPF {faceState.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={rejeitarPresenca}
              disabled={confirmando}
              variant="outline"
              className="flex-1 border-red-400/50 bg-red-500/10 text-red-200 hover:bg-red-500/20 hover:text-white text-sm h-9"
            >
              Não sou eu
            </Button>
            <Button
              onClick={confirmarPresenca}
              disabled={confirmando || !confirmReady}
              className="flex-1 bg-green-500 hover:bg-green-400 text-white font-semibold text-sm h-9 disabled:opacity-50"
            >
              {confirmando ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : !confirmReady ? (
                "Aguarde..."
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Confirmar presença
                </>
              )}
            </Button>
          </div>
        </div>
      );
    }

    if (faceState.tipo === "desconhecido") {
      return (
        <div className="absolute bottom-3 left-3 right-3 bg-red-600/95 rounded-lg px-4 py-2.5 flex items-center gap-2 pointer-events-none">
          <UserX className="w-4 h-4 text-white shrink-0" />
          <span className="text-white text-sm font-bold">Rosto não identificado nesta turma</span>
        </div>
      );
    }

    if (faceState.tipo === "registrado") {
      return (
        <div className="absolute bottom-3 left-3 right-3 bg-green-600/95 rounded-lg px-4 py-2.5 flex items-center gap-2 pointer-events-none">
          <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-white text-sm font-bold truncate">{faceState.nome}</span>
            <span className="text-green-100 text-xs">Presença confirmada</span>
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
            <span className="text-amber-100 text-xs">
              Identidade confirmada, mas presença não registrada
            </span>
          </div>
        </div>
      );
    }

    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <div
        className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-2xl flex flex-col overflow-hidden shadow-2xl"
        style={{ maxHeight: "90vh" }}
      >
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

            {isLoading && (
              <div className="flex flex-col items-center gap-4 p-8 text-center w-full">
                <Loader2 className="w-14 h-14 text-yellow-400 animate-spin" />
                <p className="text-white text-base font-semibold">Iniciando scanner...</p>
                {statusMsg ? <p className="text-slate-400 text-sm max-w-xs">{statusMsg}</p> : null}
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
                      <span className="text-amber-400 font-semibold">{comFotoCount}</span> com foto
                      cadastrada
                    </p>
                    {fotoReport && (
                      <p className="text-slate-400 mt-1">
                        <span className="text-green-400 font-semibold">{fotoReport.validadas}</span>{" "}
                        validadas no reconhecimento
                      </p>
                    )}
                  </div>
                )}
                {fotoReport && fotoReport.falhas.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowFotoReport(true)}
                    className="border-amber-400/40 text-amber-200 hover:bg-amber-500/10 text-sm"
                  >
                    Ver fotos que falharam ({fotoReport.falhas.length})
                  </Button>
                )}
                <Button
                  onClick={handleClose}
                  className="bg-yellow-400 hover:bg-yellow-300 text-black font-semibold mt-2"
                >
                  Fechar
                </Button>
              </div>
            )}

            {status === "sem_camera" && (
              <div className="flex flex-col items-center gap-4 p-8 text-center w-full">
                <Camera className="w-14 h-14 text-red-400" />
                <p className="text-white text-base font-semibold">Câmera indisponível</p>
                <p className="text-slate-400 text-sm max-w-xs">{statusMsg}</p>
                <Button
                  onClick={handleClose}
                  className="bg-yellow-400 hover:bg-yellow-300 text-black font-semibold mt-2"
                >
                  Fechar
                </Button>
              </div>
            )}

            {status === "erro" && (
              <div className="flex flex-col items-center gap-4 p-8 text-center w-full">
                <AlertCircle className="w-14 h-14 text-red-400" />
                <p className="text-white text-base font-semibold">Erro no scanner</p>
                <p className="text-slate-400 text-sm max-w-xs">{statusMsg}</p>
                <Button
                  onClick={handleClose}
                  className="bg-yellow-400 hover:bg-yellow-300 text-black font-semibold mt-2"
                >
                  Fechar
                </Button>
              </div>
            )}

            {status === "scanning" && (
              <>
                <div className="absolute top-3 left-3 right-3 flex justify-between pointer-events-none z-10">
                  <span className="bg-yellow-400 text-black text-xs px-2.5 py-1 rounded-full font-semibold">
                    {presencas.length} presença{presencas.length !== 1 ? "s" : ""}
                  </span>
                  <div className="flex items-center gap-1.5 pointer-events-auto">
                    {fotoReport && (
                      <button
                        type="button"
                        onClick={() => setShowFotoReport(true)}
                        className="bg-slate-800/90 text-slate-200 text-xs px-2.5 py-1 rounded-full flex items-center gap-1 hover:bg-slate-700"
                        title="Relatório de fotos"
                      >
                        <ImageOff className="w-3 h-3" />
                        {fotoReport.validadas}/{fotoReport.comFoto}
                      </button>
                    )}
                    {semFoto > 0 && (
                      <span className="bg-slate-800/90 text-slate-300 text-xs px-2.5 py-1 rounded-full flex items-center gap-1 pointer-events-none">
                        <UserX className="w-3 h-3" />
                        {semFoto} sem foto
                      </span>
                    )}
                  </div>
                </div>
                {semImagem && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/85 p-6 text-center">
                    <Camera className="w-12 h-12 text-amber-400" />
                    <p className="text-white text-sm font-semibold">
                      Câmera aberta, mas sem imagem
                    </p>
                    <p className="text-slate-300 text-xs max-w-xs">
                      Tentando reconectar. Se continuar assim, feche e abra a chamada novamente.
                    </p>
                  </div>
                )}
                {renderFaceBanner()}
              </>
            )}

            {showFotoReport && fotoReport && (
              <div className="absolute inset-0 z-20 bg-slate-950/95 flex flex-col p-4 overflow-hidden">
                <div className="flex items-center justify-between mb-3 shrink-0">
                  <p className="text-white font-semibold text-sm">Relatório de fotos</p>
                  <button
                    type="button"
                    onClick={() => setShowFotoReport(false)}
                    className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                    aria-label="Fechar relatório"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3 shrink-0">
                  <div className="bg-slate-800 rounded-lg px-2 py-2 text-center">
                    <p className="text-white text-lg font-bold">{fotoReport.total}</p>
                    <p className="text-slate-400 text-[10px]">Na turma</p>
                  </div>
                  <div className="bg-slate-800 rounded-lg px-2 py-2 text-center">
                    <p className="text-amber-300 text-lg font-bold">{fotoReport.comFoto}</p>
                    <p className="text-slate-400 text-[10px]">Com foto</p>
                  </div>
                  <div className="bg-slate-800 rounded-lg px-2 py-2 text-center">
                    <p className="text-green-400 text-lg font-bold">{fotoReport.validadas}</p>
                    <p className="text-slate-400 text-[10px]">Validadas</p>
                  </div>
                </div>
                {fotoReport.falhas.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-6">
                    Todas as fotos com rosto detectado.
                  </p>
                ) : (
                  <>
                    <p className="text-amber-300 text-xs font-semibold mb-2 shrink-0">
                      {fotoReport.falhas.length} foto(s) não entraram no reconhecimento
                    </p>
                    <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0">
                      {fotoReport.falhas.map((f) => (
                        <div
                          key={f.cpf}
                          className="bg-slate-800/80 rounded-lg px-3 py-2 border border-slate-700"
                        >
                          <p className="text-white text-xs font-medium truncate">{f.nome}</p>
                          <p className="text-slate-500 text-[10px]">
                            CPF {f.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}
                          </p>
                          <p className="text-amber-400/90 text-[10px] mt-0.5">{f.motivo}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                <Button
                  onClick={() => setShowFotoReport(false)}
                  className="mt-3 w-full bg-yellow-400 hover:bg-yellow-300 text-black font-semibold text-sm shrink-0"
                >
                  {status === "scanning" ? "Continuar scanner" : "Entendi"}
                </Button>
              </div>
            )}
          </div>

          <div className="w-full md:w-56 border-t md:border-t-0 md:border-l border-slate-700 flex flex-col shrink-0">
            <div className="px-4 py-3 border-b border-slate-700 shrink-0">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest">
                Registradas
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1" style={{ maxHeight: 260 }}>
              {presencas.length === 0 ? (
                <p className="text-slate-600 text-xs text-center py-6">Nenhuma ainda</p>
              ) : (
                presencas.map((p) => (
                  <div key={p.cpf} className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate">{p.nome}</p>
                      <p className="text-slate-500 text-[10px]">{p.hora}</p>
                    </div>
                    <button
                      type="button"
                      title="Remover (marcado por engano)"
                      disabled={removendoCpf === p.cpf}
                      onClick={() => removerPresenca(p.cpf)}
                      className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0 disabled:opacity-40"
                    >
                      {removendoCpf === p.cpf ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="p-3 border-t border-slate-700 shrink-0 space-y-2">
              {temAcoesExtras ? (
                <>
                  <Button
                    onClick={handleFinalize}
                    className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-semibold text-sm"
                  >
                    {finalizeLabel} {presencas.length > 0 ? `(${presencas.length})` : ""}
                  </Button>
                  <div className="flex gap-2">
                    {onEditarComPresencas && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleEditar}
                        className="flex-1 border-slate-500 bg-slate-800 text-slate-100 hover:bg-slate-700 hover:text-white text-sm"
                      >
                        <Pencil className="w-3.5 h-3.5 mr-1" />
                        Editar
                      </Button>
                    )}
                    {onRefazer && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleRefazer}
                        className="flex-1 border-red-400/40 bg-red-500/10 text-red-200 hover:bg-red-500/20 hover:text-white text-sm"
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1" />
                        Refazer
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <Button
                  onClick={handleFinalize}
                  className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-semibold text-sm"
                >
                  {finalizeLabel} {presencas.length > 0 ? `(${presencas.length})` : ""}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
