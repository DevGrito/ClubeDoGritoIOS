import { gvSectors, gvProjects, gvMgmtIndicators, gvIndicatorAssignments, gvIndicatorTargets, gvIndicatorValues } from '../shared/schema';

// Seeds para Sistema de Gestão à Vista (Meta × Realizado)
export const gestaoVistaSeedsData = {
  // 1. SETORES (Programas)
  sectors: [
    {
      name: "Cultura e Esporte",
      slug: "cultura_esporte",
      description: "Programa voltado para atividades culturais e esportivas para jovens"
    },
    {
      name: "Inclusão Produtiva",
      slug: "inclusao_produtiva", 
      description: "Programa de capacitação profissional e inserção no mercado de trabalho"
    },
    {
      name: "Psicossocial",
      slug: "psicossocial",
      description: "Programa de apoio psicossocial e acompanhamento familiar"
    },
    {
      name: "Marketing",
      slug: "marketing",
      description: "Programa de comunicação e marketing institucional"
    },
    {
      name: "Favela 3D",
      slug: "favela3d",
      description: "Programa de desenvolvimento comunitário"
    }
  ],

  // 2. PROJETOS (por setor)
  projects: [
    // Cultura e Esporte
    {
      name: "Casa Sonhar",
      slug: "casa_sonhar",
      sector_slug: "cultura_esporte",
      description: "Centro de atividades culturais e educacionais"
    },
    {
      name: "Polo Esportivo Cultural Glória",
      slug: "polo_gloria",
      sector_slug: "cultura_esporte",
      description: "Polo esportivo e cultural na região da Glória"
    },
    {
      name: "Sala Serenata",
      slug: "sala_serenata",
      sector_slug: "cultura_esporte",
      description: "Espaço cultural para apresentações e ensaios"
    },
    
    // Inclusão Produtiva
    {
      name: "Laboratório Vozes do Futuro",
      slug: "lab_vozes_futuro",
      sector_slug: "inclusao_produtiva",
      description: "Laboratório de capacitação profissional e inovação"
    },
    {
      name: "Programa de Geração de Renda",
      slug: "geracao_renda",
      sector_slug: "inclusao_produtiva",
      description: "Programa focado na geração de renda para famílias"
    },
    
    // Psicossocial
    {
      name: "Acompanhamento Familiar",
      slug: "acompanhamento_familiar",
      sector_slug: "psicossocial",
      description: "Programa de acompanhamento e apoio às famílias"
    },
    {
      name: "Grupo de Apoio Comunitário",
      slug: "apoio_comunitario",
      sector_slug: "psicossocial",
      description: "Grupos de apoio psicossocial na comunidade"
    },
    
    // Marketing
    {
      name: "Comunicação Digital",
      slug: "comunicacao_digital",
      sector_slug: "marketing",
      description: "Estratégias de comunicação digital e redes sociais"
    },
    {
      name: "Eventos Institucionais",
      slug: "eventos_institucionais",
      sector_slug: "marketing",
      description: "Organização de eventos e ações de visibilidade"
    },
    
    // Favela 3D
    {
      name: "Desenvolvimento Comunitário",
      slug: "desenvolvimento_comunitario",
      sector_slug: "favela3d",
      description: "Projeto de melhoria da infraestrutura comunitária"
    }
  ],

  // 3. CATÁLOGO DE INDICADORES
  indicators: [
    {
      name: "Frequência",
      description: "Percentual de frequência dos participantes",
      unit: "%",
      calculation_method: "Presentes / Total inscritos * 100",
      data_source: "Sistema de chamada",
      update_frequency: "Mensal"
    },
    {
      name: "Evasão",
      description: "Taxa de evasão de participantes",
      unit: "%",
      calculation_method: "Evadidos / Total inscritos * 100", 
      data_source: "Sistema de cadastro",
      update_frequency: "Mensal"
    },
    {
      name: "NPS (Net Promoter Score)",
      description: "Índice de satisfação dos participantes",
      unit: "%",
      calculation_method: "% Promotores - % Detratores",
      data_source: "Pesquisa de satisfação",
      update_frequency: "Semestral"
    },
    {
      name: "Participantes Ativos",
      description: "Número de participantes ativos no mês",
      unit: "pessoas",
      calculation_method: "Contagem de participantes com pelo menos 1 atividade",
      data_source: "Sistema de atividades",
      update_frequency: "Mensal"
    },
    {
      name: "Atividades Realizadas",
      description: "Número de atividades realizadas no período",
      unit: "atividades",
      calculation_method: "Contagem de atividades concluídas",
      data_source: "Sistema de planejamento",
      update_frequency: "Mensal"
    },
    {
      name: "Inserção no Mercado de Trabalho",
      description: "Percentual de participantes inseridos no mercado",
      unit: "%",
      calculation_method: "Inseridos / Total capacitados * 100",
      data_source: "Acompanhamento pós-curso",
      update_frequency: "Mensal"
    },
    {
      name: "Famílias Acompanhadas",
      description: "Número de famílias em acompanhamento",
      unit: "famílias",
      calculation_method: "Contagem de famílias ativas",
      data_source: "Sistema de acompanhamento",
      update_frequency: "Mensal"
    },
    {
      name: "Engajamento Digital",
      description: "Taxa de engajamento nas redes sociais",
      unit: "%",
      calculation_method: "Interações / Alcance * 100",
      data_source: "Analytics das redes sociais",
      update_frequency: "Mensal"
    },
    {
      name: "Participação em Eventos",
      description: "Número de participantes em eventos",
      unit: "pessoas",
      calculation_method: "Soma de participantes por evento",
      data_source: "Lista de presença eventos",
      update_frequency: "Mensal"
    },
    {
      name: "Melhorias de Infraestrutura",
      description: "Número de melhorias implementadas",
      unit: "melhorias",
      calculation_method: "Contagem de intervenções concluídas",
      data_source: "Relatório de obras",
      update_frequency: "Mensal"
    }
  ],

  // 4. ASSIGNMENTS (Vinculação Indicadores-Projetos)
  assignments: [
    // Casa Sonhar
    { project_slug: "casa_sonhar", indicator_name: "Frequência", is_primary: true, weight: 1.0 },
    { project_slug: "casa_sonhar", indicator_name: "Evasão", is_primary: false, weight: 0.8 },
    { project_slug: "casa_sonhar", indicator_name: "NPS (Net Promoter Score)", is_primary: false, weight: 0.6 },
    { project_slug: "casa_sonhar", indicator_name: "Participantes Ativos", is_primary: false, weight: 0.7 },
    { project_slug: "casa_sonhar", indicator_name: "Atividades Realizadas", is_primary: false, weight: 0.5 },
    
    // Polo Glória
    { project_slug: "polo_gloria", indicator_name: "Frequência", is_primary: true, weight: 1.0 },
    { project_slug: "polo_gloria", indicator_name: "Evasão", is_primary: false, weight: 0.8 },
    { project_slug: "polo_gloria", indicator_name: "Participantes Ativos", is_primary: false, weight: 0.7 },
    { project_slug: "polo_gloria", indicator_name: "Atividades Realizadas", is_primary: false, weight: 0.6 },
    
    // Lab Vozes do Futuro
    { project_slug: "lab_vozes_futuro", indicator_name: "NPS (Net Promoter Score)", is_primary: true, weight: 1.0 },
    { project_slug: "lab_vozes_futuro", indicator_name: "Inserção no Mercado de Trabalho", is_primary: false, weight: 0.9 },
    { project_slug: "lab_vozes_futuro", indicator_name: "Participantes Ativos", is_primary: false, weight: 0.6 },
    
    // Acompanhamento Familiar
    { project_slug: "acompanhamento_familiar", indicator_name: "Famílias Acompanhadas", is_primary: true, weight: 1.0 },
    { project_slug: "acompanhamento_familiar", indicator_name: "NPS (Net Promoter Score)", is_primary: false, weight: 0.7 },
    
    // Comunicação Digital
    { project_slug: "comunicacao_digital", indicator_name: "Engajamento Digital", is_primary: true, weight: 1.0 },
    { project_slug: "comunicacao_digital", indicator_name: "Participação em Eventos", is_primary: false, weight: 0.5 },
    
    // Eventos Institucionais
    { project_slug: "eventos_institucionais", indicator_name: "Participação em Eventos", is_primary: true, weight: 1.0 },
    { project_slug: "eventos_institucionais", indicator_name: "Engajamento Digital", is_primary: false, weight: 0.4 },
    
    // Desenvolvimento Comunitário
    { project_slug: "desenvolvimento_comunitario", indicator_name: "Melhorias de Infraestrutura", is_primary: true, weight: 1.0 },
    { project_slug: "desenvolvimento_comunitario", indicator_name: "Famílias Acompanhadas", is_primary: false, weight: 0.6 }
  ],

  // 5. METAS (Targets) - Setembro 2025
  targets: [
    // Casa Sonhar - Set 2025
    { project_slug: "casa_sonhar", indicator_name: "Frequência", scope: "monthly", period: "2025-09", target_value: 85.0 },
    { project_slug: "casa_sonhar", indicator_name: "Evasão", scope: "monthly", period: "2025-09", target_value: 8.0 },
    { project_slug: "casa_sonhar", indicator_name: "Participantes Ativos", scope: "monthly", period: "2025-09", target_value: 120.0 },
    { project_slug: "casa_sonhar", indicator_name: "Atividades Realizadas", scope: "monthly", period: "2025-09", target_value: 20.0 },
    
    // Polo Glória - Set 2025
    { project_slug: "polo_gloria", indicator_name: "Frequência", scope: "monthly", period: "2025-09", target_value: 80.0 },
    { project_slug: "polo_gloria", indicator_name: "Evasão", scope: "monthly", period: "2025-09", target_value: 10.0 },
    { project_slug: "polo_gloria", indicator_name: "Participantes Ativos", scope: "monthly", period: "2025-09", target_value: 90.0 },
    
    // Lab Vozes do Futuro - Set 2025
    { project_slug: "lab_vozes_futuro", indicator_name: "NPS (Net Promoter Score)", scope: "monthly", period: "2025-09", target_value: 80.0 },
    { project_slug: "lab_vozes_futuro", indicator_name: "Inserção no Mercado de Trabalho", scope: "monthly", period: "2025-09", target_value: 70.0 },
    
    // Outros projetos
    { project_slug: "acompanhamento_familiar", indicator_name: "Famílias Acompanhadas", scope: "monthly", period: "2025-09", target_value: 50.0 },
    { project_slug: "comunicacao_digital", indicator_name: "Engajamento Digital", scope: "monthly", period: "2025-09", target_value: 12.0 },
    { project_slug: "eventos_institucionais", indicator_name: "Participação em Eventos", scope: "monthly", period: "2025-09", target_value: 200.0 },
    { project_slug: "desenvolvimento_comunitario", indicator_name: "Melhorias de Infraestrutura", scope: "monthly", period: "2025-09", target_value: 3.0 }
  ],

  // 6. VALORES REALIZADOS (Set 2025) - Para exibir exemplos
  values: [
    // Casa Sonhar - Resultados de Set 2025
    { project_slug: "casa_sonhar", indicator_name: "Frequência", scope: "monthly", period: "2025-09", actual_value: 86.0, data_source: "Sistema de chamada" },
    { project_slug: "casa_sonhar", indicator_name: "Evasão", scope: "monthly", period: "2025-09", actual_value: 7.5, data_source: "Sistema de cadastro" },
    { project_slug: "casa_sonhar", indicator_name: "Participantes Ativos", scope: "monthly", period: "2025-09", actual_value: 125.0, data_source: "Sistema de atividades" },
    { project_slug: "casa_sonhar", indicator_name: "Atividades Realizadas", scope: "monthly", period: "2025-09", actual_value: 22.0, data_source: "Sistema de planejamento" },
    
    // Polo Glória - Resultados de Set 2025  
    { project_slug: "polo_gloria", indicator_name: "Frequência", scope: "monthly", period: "2025-09", actual_value: 76.0, data_source: "Sistema de chamada" },
    { project_slug: "polo_gloria", indicator_name: "Evasão", scope: "monthly", period: "2025-09", actual_value: 12.0, data_source: "Sistema de cadastro" },
    { project_slug: "polo_gloria", indicator_name: "Participantes Ativos", scope: "monthly", period: "2025-09", actual_value: 85.0, data_source: "Sistema de atividades" },
    
    // Lab Vozes do Futuro - Resultados de Set 2025
    { project_slug: "lab_vozes_futuro", indicator_name: "NPS (Net Promoter Score)", scope: "monthly", period: "2025-09", actual_value: 65.0, data_source: "Pesquisa de satisfação" },
    { project_slug: "lab_vozes_futuro", indicator_name: "Inserção no Mercado de Trabalho", scope: "monthly", period: "2025-09", actual_value: 72.0, data_source: "Acompanhamento pós-curso" },
    
    // Outros projetos
    { project_slug: "acompanhamento_familiar", indicator_name: "Famílias Acompanhadas", scope: "monthly", period: "2025-09", actual_value: 48.0, data_source: "Sistema de acompanhamento" },
    { project_slug: "comunicacao_digital", indicator_name: "Engajamento Digital", scope: "monthly", period: "2025-09", actual_value: 14.5, data_source: "Analytics das redes sociais" },
    { project_slug: "eventos_institucionais", indicator_name: "Participação em Eventos", scope: "monthly", period: "2025-09", actual_value: 180.0, data_source: "Lista de presença eventos" },
    { project_slug: "desenvolvimento_comunitario", indicator_name: "Melhorias de Infraestrutura", scope: "monthly", period: "2025-09", actual_value: 2.0, data_source: "Relatório de obras" }
  ]
};