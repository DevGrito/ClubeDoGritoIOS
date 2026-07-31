/** Rota de volta do portal Meus dados conforme o perfil logado. */
export function resolveLgpdBackPath(papel?: string | null, role?: string | null): string {
  const p = (papel || role || "").toLowerCase();
  if (p === "aluno" || p === "aluno_portal") return "/aluno";
  if (p === "patrocinador") return "/perfil-patrocinador";
  if (p.startsWith("professor") || p === "lider" || p === "professor_lider") return "/professor";
  if (p.startsWith("monitor")) return "/monitor";
  if (p === "coordenador_pec") return "/coordenador/esporte-cultura";
  if (p === "coordenador_inclusao") return "/coordenador/inclusao-produtiva";
  if (p === "coordenador_psico" || p === "tecnica_psico") return "/coordenador/psicossocial";
  if (p === "coordenador_negocios") return "/coordenador/negocios-sociais";
  if (p === "coordenador_almoxarifado") return "/coordenador/almoxarifado";
  if (p.startsWith("coordenador")) return "/coordenador";
  if (p === "conselheiro" || p === "conselho") return "/conselho";
  return "/perfil";
}

export function isConselhoLgpdProfile(papel?: string | null, role?: string | null): boolean {
  const p = (papel || role || "").toLowerCase();
  return p === "conselho" || p === "conselheiro";
}

export function isNonDonorLgpdProfile(papel?: string | null, role?: string | null): boolean {
  const p = (papel || role || "").toLowerCase();
  return (
    p === "aluno" ||
    p === "aluno_portal" ||
    p.startsWith("professor") ||
    p.startsWith("monitor") ||
    p.startsWith("coordenador") ||
    p === "tecnica_psico" ||
    p === "patrocinador" ||
    p === "lider" ||
    p === "professor_lider" ||
    isConselhoLgpdProfile(p)
  );
}
