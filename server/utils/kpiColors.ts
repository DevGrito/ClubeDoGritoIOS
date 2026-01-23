type KpiColor = 'green' | 'yellow' | 'red' | 'gray' | 'blue';

interface KpiInput {
  id: string;
  valor: number;
  meta?: number;
  tipo: 'percent' | 'count';
  mesVigente?: number; // Mês vigente (1-12) para cálculo de meta progressiva (LEGADO)
  mesFiltro?: number | null; // Mês do filtro: número (1-12) para mensal, null para anual
}

interface KpiResult {
  color: KpiColor;
  progress: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getKpiColor({ id, valor, meta, tipo, mesVigente = 10, mesFiltro }: KpiInput): KpiResult {
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
  // PERCENTUAIS COM META: frequencia, criterioSucesso (avaliação de aprendizagem)
  // Para percentuais, valor e meta já são em % (ex: 89% vs meta de 90%)
  // Verde: ≥ meta, Amarelo: 80% da meta até meta-1, Vermelho: < 80% da meta
  // ==================================================================
  if ((id === 'frequencia' || id === 'criterioSucesso') && meta) {
    let color: KpiColor;
    const limiteAmarelo = meta * 0.8; // 80% da meta
    
    if (valorNormalizado >= meta) {
      color = 'green'; // Atingiu ou passou a meta
    } else if (valorNormalizado >= limiteAmarelo) {
      color = 'yellow'; // Entre 80% e 99% da meta
    } else {
      color = 'red'; // Abaixo de 80% da meta
    }
    
    return {
      color,
      progress: clamp(valorNormalizado, 0, 100)
    };
  }

  // ==================================================================
  // NOVA LÓGICA: META MENSAL vs META ANUAL (2025)
  // Quando mesFiltro !== null (filtro por mês): usar meta mensal = metaAnual / 10
  // Quando mesFiltro === null (filtro "Todos"): usar meta anual completa
  //
  // Regras de Cor (padrão):
  // - Verde: >= 100% da meta
  // - Amarelo: 80% a 99% da meta
  // - Vermelho: < 80% da meta
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
    // Determinar meta de referência: mensal ou anual
    let metaReferencia: number;
    
    if (mesFiltro !== null && mesFiltro !== undefined) {
      // Filtro MENSAL: meta do mês = meta anual ÷ 10 meses
      metaReferencia = meta / 10;
    } else {
      // Filtro ANUAL ("Todos"): meta anual completa
      metaReferencia = meta;
    }
    
    // EVASÃO: Lógica invertida (menor é melhor)
    if (id === 'evasao') {
      let color: KpiColor;
      const percentualDaMeta = (valorNormalizado / metaReferencia) * 100;
      
      // Invertido: quanto menor o percentual, melhor
      if (percentualDaMeta <= 100) {
        color = 'green'; // Dentro ou abaixo da meta
      } else if (percentualDaMeta <= 120) {
        color = 'yellow'; // Até 20% acima da meta
      } else {
        color = 'red'; // Muito acima da meta
      }
      
      // Progress invertido para evasão (quanto menor, melhor)
      const progressInvertido = Math.max(0, 100 - percentualDaMeta);
      return {
        color,
        progress: clamp(progressInvertido, 0, 100)
      };
    }

    // DEMAIS INDICADORES: Lógica normal (maior é melhor)
    // REGRA NOVA: >= 100% = verde | 80-99% = amarelo | < 80% = vermelho
    let color: KpiColor;
    const percentualDaMeta = (valorNormalizado / metaReferencia) * 100;
    
    if (percentualDaMeta >= 100) {
      color = 'green'; // Bateu ou passou a meta
    } else if (percentualDaMeta >= 80) {
      color = 'yellow'; // Entre 80-99% da meta
    } else {
      color = 'red'; // Abaixo de 80% da meta
    }
    
    return {
      color,
      progress: Math.min(100, percentualDaMeta)
    };
  }

  // ==================================================================
  // REGRA PADRÃO: Percentuais gerais (fallback)
  // Para percentuais, valor e meta já são em % (ex: 89% vs meta de 90%)
  // Verde: ≥ meta, Amarelo: 80% da meta até meta-1, Vermelho: < 80% da meta
  // ==================================================================
  if (tipo === 'percent' && meta) {
    let color: KpiColor;
    const limiteAmarelo = meta * 0.8; // 80% da meta
    
    if (valorNormalizado >= meta) {
      color = 'green'; // Atingiu ou passou a meta
    } else if (valorNormalizado >= limiteAmarelo) {
      color = 'yellow'; // Entre 80% e 99% da meta
    } else {
      color = 'red'; // Abaixo de 80% da meta
    }
    
    return {
      color,
      progress: clamp(valorNormalizado, 0, 100)
    };
  }

  // ==================================================================
  // REGRA PADRÃO: Contagens gerais (fallback)
  // Verde: ≥100%, Amarelo: 80-99%, Vermelho: <80%
  // ==================================================================
  if (tipo === 'count' && meta) {
    let color: KpiColor;
    const percentual = (valorNormalizado / meta) * 100;
    
    if (percentual >= 100) {
      color = 'green'; // Bateu ou passou a meta (≥100%)
    } else if (percentual >= 80) {
      color = 'yellow'; // Entre 80-99% da meta
    } else {
      color = 'red'; // Abaixo de 80% da meta
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
