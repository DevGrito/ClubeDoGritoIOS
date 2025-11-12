type KpiColor = 'green' | 'yellow' | 'red' | 'gray' | 'blue';

interface KpiInput {
  id: string;
  valor: number;
  meta?: number;
  tipo: 'percent' | 'count';
  mesVigente?: number; // Mês vigente (1-12) para cálculo de meta progressiva
}

interface KpiResult {
  color: KpiColor;
  progress: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getKpiColor({ id, valor, meta, tipo, mesVigente = 10 }: KpiInput): KpiResult {
  // Sem meta para contagens = azul (caso especial: alunos em formação)
  if (tipo === 'count' && !meta) {
    return { color: 'blue', progress: 100 };
  }

  // Converter NPS (-100 a +100) para escala 0-100 se necessário
  let valorNormalizado = valor;
  if (id === 'nps' && valor < 0) {
    valorNormalizado = (valor + 100) / 2;
  }

  // ==================================================================
  // MÉTODO 2: PERCENTUAL FIXO (85%)
  // Indicadores: frequencia, criterioSucesso (avaliação de aprendizagem)
  // Verde: ≥85% | Amarelo: 80-84% | Vermelho: <80%
  // ==================================================================
  if (id === 'frequencia' || id === 'criterioSucesso') {
    let color: KpiColor;
    
    if (valorNormalizado >= 85) {
      color = 'green'; // ≥85%
    } else if (valorNormalizado >= 80) {
      color = 'yellow'; // 80-84%
    } else {
      color = 'red'; // <80%
    }
    
    return {
      color,
      progress: clamp(valorNormalizado, 0, 100)
    };
  }

  // ==================================================================
  // MÉTODO 1: META PROGRESSIVA MENSAL
  // Indicadores de contagem: criancasAtendidas, alunosFormados, alunosEmFormacao,
  //                          nps, geracaoRenda, familiasAtivas, visitasDomicilio,
  //                          atendimentosPsico, evasao
  // Meta Progressiva = (Meta Anual / 10) × mesVigente
  // Verde: ≥100% da meta progressiva
  // Amarelo: 80-99% da meta progressiva
  // Vermelho: <80% da meta progressiva
  // ==================================================================
  const indicadoresMetaProgressiva = [
    'criancasAtendidas',
    'alunosFormados',
    'alunosEmFormacao',
    'nps',
    'geracaoRenda',
    'empreendedores',
    'pessoasEmpregadas',
    'familiasAtivas',
    'visitasDomicilio',
    'atendimentosPsico',
    'evasao'
  ];

  if (indicadoresMetaProgressiva.includes(id) && meta) {
    // Calcular meta progressiva: (Meta Anual / 10 meses) × mês vigente
    const metaProgressiva = (meta / 10) * mesVigente;
    
    // EVASÃO: Lógica invertida (menor é melhor)
    if (id === 'evasao') {
      let color: KpiColor;
      
      if (valorNormalizado <= metaProgressiva) {
        color = 'green'; // Dentro ou abaixo da meta
      } else if (valorNormalizado <= metaProgressiva * 1.25) {
        color = 'yellow'; // Até 25% acima da meta
      } else {
        color = 'red'; // Muito acima da meta
      }
      
      // Progress invertido para evasão
      const percentualDaMeta = (valorNormalizado / metaProgressiva) * 100;
      return {
        color,
        progress: 100 - clamp(percentualDaMeta, 0, 100)
      };
    }

    // DEMAIS INDICADORES: Lógica normal (maior é melhor)
    // REGRA: >= 100% = azul | 80-99% = amarelo | < 80% = vermelho
    let color: KpiColor;
    const percentualDaMeta = (valorNormalizado / metaProgressiva) * 100;
    
    if (percentualDaMeta >= 100) {
      color = 'blue'; // Ultrapassou a meta progressiva
    } else if (percentualDaMeta >= 80) {
      color = 'yellow'; // Entre 80-99% da meta progressiva
    } else {
      color = 'red'; // Abaixo de 80% da meta progressiva
    }
    
    return {
      color,
      progress: Math.min(100, percentualDaMeta)
    };
  }

  // ==================================================================
  // REGRA PADRÃO: Percentuais gerais (fallback)
  // Azul: > meta, Verde: 80-100%, Amarelo: 50-79%, Vermelho: < 50%
  // ==================================================================
  if (tipo === 'percent' && meta) {
    let color: KpiColor;
    
    if (valorNormalizado > meta) {
      color = 'blue'; // Acima da meta
    } else if (valorNormalizado >= meta * 0.8) {
      color = 'green'; // 80-100% da meta
    } else if (valorNormalizado >= meta * 0.5) {
      color = 'yellow'; // 50-79% da meta
    } else {
      color = 'red'; // Abaixo de 50%
    }
    
    return {
      color,
      progress: clamp(valorNormalizado, 0, 100)
    };
  }

  // ==================================================================
  // REGRA PADRÃO: Contagens gerais (fallback)
  // Azul: > meta, Verde: 80-100%, Amarelo: 50-79%, Vermelho: < 50%
  // ==================================================================
  if (tipo === 'count' && meta) {
    let color: KpiColor;
    const percentual = (valorNormalizado / meta) * 100;
    
    if (valorNormalizado > meta) {
      color = 'blue'; // Acima da meta
    } else if (percentual >= 80) {
      color = 'green'; // 80-100% da meta
    } else if (percentual >= 50) {
      color = 'yellow'; // 50-79% da meta
    } else {
      color = 'red'; // Abaixo de 50%
    }
    
    return {
      color,
      progress: Math.min(100, percentual)
    };
  }

  // Fallback: cinza
  return { color: 'gray', progress: 0 };
}

// Mapeamento de cores para classes CSS do Tailwind
export function getColorClass(color: KpiColor): string {
  switch (color) {
    case 'blue':
      return 'bg-blue-500'; // Azul = superou a meta
    case 'green':
      return 'bg-green-500';
    case 'yellow':
      return 'bg-yellow-500';
    case 'red':
      return 'bg-red-500';
    case 'gray':
    default:
      return 'bg-gray-300';
  }
}
