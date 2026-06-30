/** Envia id da ficha de staff no POST de consentimento (área employees). */
export function getStaffConsentHint(
  consentArea: string
): { staff_tipo: string; staff_id: number } | null {
  if (consentArea !== "employees") return null;

  const professorId = localStorage.getItem("professorId");
  if (professorId) {
    const id = Number(professorId);
    if (Number.isFinite(id) && id > 0) return { staff_tipo: "professor", staff_id: id };
  }

  const monitorId = localStorage.getItem("monitorId");
  if (monitorId) {
    const id = Number(monitorId);
    if (Number.isFinite(id) && id > 0) return { staff_tipo: "monitor", staff_id: id };
  }

  const coordenadorId = localStorage.getItem("coordenadorId");
  if (coordenadorId) {
    const id = Number(coordenadorId);
    if (Number.isFinite(id) && id > 0) return { staff_tipo: "coordenador", staff_id: id };
  }

  return null;
}
