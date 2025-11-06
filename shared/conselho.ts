// Lista de e-mails do conselho do Clube do Grito
export const conselhoEmails = [
  "paulobiamino@outlook.com",
  "dimitry@newon.io",
  "biamino.paulo@gmail.com",
  "alexandre.azevedo@seculus.com.br",
  "jayme.nicolato@gmail.com",
  "mflaviacarvalho@uol.com.br",
  "hteixeirarios@gmail.com",
  "joao.andrade@localiza.com",
  "marcop@patrus.com.br",
  "vivianebarreto@fdc.org.br",
  "patricia@patrimar.com.br",
  "brunovilelacunha@yahoo.com.br",
  "marketing@institutoogrito.org" // Juliana Correa
];

// Lista de e-mails com acesso administrativo completo
export const adminEmails = [
  "paulobiamino@outlook.com",
  "dimitry@newon.io",
  "biamino.paulo@gmail.com"
];

// Função para verificar se um email pertence ao conselho
export function isConselhoEmail(email: string): boolean {
  return conselhoEmails.includes(email.toLowerCase());
}

// E-mail especial do Léo Martins (super-administrador)
export const leoMartinsEmail = "leo@clubedogrito.com";

// Função para verificar se um email tem acesso administrativo
export function isAdminEmail(email: string): boolean {
  return adminEmails.includes(email.toLowerCase());
}

// Função para verificar se é o Léo Martins
export function isLeoMartins(email: string): boolean {
  return email.toLowerCase() === leoMartinsEmail.toLowerCase();
}

// Função para obter estatísticas do conselho
export function getConselhoStats() {
  return {
    totalMembers: conselhoEmails.length,
    domains: Array.from(new Set(conselhoEmails.map(email => email.split('@')[1]))),
  };
}