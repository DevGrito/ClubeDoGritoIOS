// Utilitários para trabalhar com data/hora no fuso horário de Brasília (UTC-3)

export function getBrazilDate(): Date {
  // Cria uma data ajustada para o fuso de Brasília
  const now = new Date();
  // Brasília é UTC-3
  const brazilOffset = -3 * 60; // em minutos
  const localOffset = now.getTimezoneOffset(); // em minutos
  const diff = brazilOffset - (-localOffset); // diferença em minutos
  
  return new Date(now.getTime() + diff * 60 * 1000);
}

export function getBrazilDateString(): string {
  // Retorna a data de hoje em Brasília no formato YYYY-MM-DD
  const brazil = getBrazilDate();
  const year = brazil.getFullYear();
  const month = String(brazil.getMonth() + 1).padStart(2, '0');
  const day = String(brazil.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateBrazil(dateInput: string | Date): string {
  // Formata uma data para exibição no formato DD/MM/AAAA
  if (!dateInput) return 'Sem data';
  
  let date: Date;
  if (typeof dateInput === 'string') {
    // Datas de calendário não representam um instante. Preserve os componentes
    // recebidos mesmo quando a API serializa o DATE como meia-noite em UTC.
    const dateOnly = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T)/);
    if (dateOnly) {
      const [, year, month, day] = dateOnly;
      date = new Date(Number(year), Number(month) - 1, Number(day), 12);
    } else {
      date = new Date(dateInput);
    }
  } else {
    date = dateInput;
  }
  
  return date.toLocaleDateString('pt-BR');
}
