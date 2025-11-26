// src/utils/isLeo.ts
import { isLeoMartins } from "@shared/conselho";

interface LeoUserLike {
  email?: string;
  telefone?: string;
  role?: string;
}

export function isLeoUser(userData: LeoUserLike | null | undefined) {
  if (!userData) return false;

  const isLeoByEmail = isLeoMartins(userData.email || "");

  const normalizedPhone = (userData.telefone || "").replace(/\D/g, "");
  const leosPhones = new Set([
    "31998783003",
    "5531998783003",
    "31987830003",
    "5531987830003",
    "31993741556",
    "5531993741556",
  ]);

  const isLeoByPhone = leosPhones.has(normalizedPhone);
  const isLeoByRole = userData.role === "leo";

  return isLeoByEmail || isLeoByPhone || isLeoByRole;
}
