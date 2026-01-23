export const chartData = {
  // General Dashboard Charts
  sectorComparison: {
    donation: { value: 1522 },
    sponor: { value: 80 },
    student: { value: 796 },
    collaborator: { value: 45 },
  },
  monthlyTrends: [
    { month: 'Jul', doadores: 0, patrocinadores: 0, alunos: 0, colaboradores: 0 },
    { month: 'Ago', doadores: 0, patrocinadores: 0, alunos: 0, colaboradores: 0 },
    { month: 'Set', doadores: 0, patrocinadores: 0, alunos: 0, colaboradores: 0 },
    { month: 'Out', doadores: 0, patrocinadores: 0, alunos: 0, colaboradores: 0 },
    { month: 'Nov', doadores: 0, patrocinadores: 0, alunos: 0, colaboradores: 0 },
    { month: 'Dez', doadores: 0, patrocinadores: 0, alunos: 0, colaboradores: 0 }
  ],
  distributionPieData: [
    { name: 'Doadores', value: 12, color: '#f59e0b' },
    { name: 'Alunos', value: 796, color: '#10b981' },
    { name: 'Patrocinadores', value: 50, color: '#3b82f6' },
    { name: 'Colaboradores', value: 45, color: '#8b5cf6' }
  ],
  // Sector-specific enhanced data
  doadorData: {
    donationKpis: {
      totalDonors: { value: 1522 },
      averageDonation: { value: "15.500,00" },
      totalRaised: { value: "25.000,00" },
      retentionRate: { value: "15%" }
    },
    monthlyDonations: [
      { month: 'Jul', valor: 0, quantidade: 0 },
      { month: 'Ago', valor: 0, quantidade: 0 },
      { month: 'Set', valor: 0, quantidade: 0 },
      { month: 'Out', valor: 0, quantidade: 0 },
      { month: 'Nov', valor: 0, quantidade: 0 },
      { month: 'Dez', valor: 0, quantidade: 0 }
    ],
    donationsByValue: [
      { faixa: 'R$10-50', quantidade: 0, percentual: 0 },
      { faixa: 'R$51-100', quantidade: 0, percentual: 0 },
      { faixa: 'R$101-200', quantidade: 0, percentual: 0 },
      { faixa: 'R$201-500', quantidade: 0, percentual: 0 },
      { faixa: 'R$500+', quantidade: 0, percentual: 0 }
    ],
    retentionRate: [
      { mes: 'Jul', novos: 0, recorrentes: 0, taxa: 0 },
      { mes: 'Ago', novos: 0, recorrentes: 0, taxa: 0 },
      { mes: 'Set', novos: 0, recorrentes: 0, taxa: 0 },
      { mes: 'Out', novos: 0, recorrentes: 0, taxa: 0 },
      { mes: 'Nov', novos: 0, recorrentes: 0, taxa: 0 },
      { mes: 'Dez', novos: 0, recorrentes: 0, taxa: 0 }
    ]
  },
  sponorData: {
    sponorKpis: {
      totalSponsors: { value: 50 },
      totalInvestment: { value: "12.000,00" },
      activeProjects: { value: 20 },
      activeContractsRate: { value: "42%" },
    },
    investmentByCategory: [
      { categoria: 'Educação', valor: 0, projetos: 0 },
      { categoria: 'Saúde', valor: 0, projetos: 0 },
      { categoria: 'Infraestrutura', valor: 0, projetos: 0 },
      { categoria: 'Tecnologia', valor: 0, projetos: 0 },
      { categoria: 'Cultura', valor: 0, projetos: 0 }
    ],
    sponsorshipTrends: [
      { quarter: 'Q1', valor: 0, patrocinadores: 0 },
      { quarter: 'Q2', valor: 0, patrocinadores: 0 },
      { quarter: 'Q3', valor: 0, patrocinadores: 0 },
      { quarter: 'Q4', valor: 0, patrocinadores: 0 }
    ],
    contractStatus: [
      { status: 'Ativo', quantidade: 0, percentual: 0 },
      { status: 'Renovação', quantidade: 0, percentual: 0 },
      { status: 'Pendente', quantidade: 0, percentual: 0 },
      { status: 'Cancelado', quantidade: 0, percentual: 0 }
    ]
  },
  studentData: {
    studentKpis: {
      totalStudents: { value: 796 },
      completionRate: { value: "62%" },
      activeCourses: { value: 13 },
      dropoutRate: { value: "35%" },
    },
    enrollmentTrends: [
      { month: 'Jul', matriculados: 0, concluidos: 0, desistencias: 0 },
      { month: 'Ago', matriculados: 0, concluidos: 0, desistencias: 0 },
      { month: 'Set', matriculados: 0, concluidos: 0, desistencias: 0 },
      { month: 'Out', matriculados: 0, concluidos: 0, desistencias: 0 },
      { month: 'Nov', matriculados: 0, concluidos: 0, desistencias: 0 },
      { month: 'Dez', matriculados: 0, concluidos: 0, desistencias: 0 }
    ],
    performanceByArea: [
      { area: 'Tecnologia', aprovados: 0, reprovados: 0, taxa: 0 },
      { area: 'Artesanato', aprovados: 0, reprovados: 0, taxa: 0 },
      { area: 'Culinária', aprovados: 0, reprovados: 0, taxa: 0 },
      { area: 'Costura', aprovados: 0, reprovados: 0, taxa: 0 },
      { area: 'Informática', aprovados: 0, reprovados: 0, taxa: 0 }
    ],
    ageDistribution: [
      { faixa: '16-25', quantidade: 0, percentual: 0 },
      { faixa: '26-35', quantidade: 0, percentual: 0 },
      { faixa: '36-45', quantidade: 0, percentual: 0 },
      { faixa: '46-55', quantidade: 0, percentual: 0 },
      { faixa: '56+', quantidade: 0, percentual: 0 }
    ]
  },
  collaboratorData: {
    collaboratorKpis: {
      totalCollaborators: { value: 45 },
      productivityRate: { value: "72%" },
      activeProjectsCollab: { value: 40 },
      satisfactionScore: { value: 100 },
    },
    productivityMetrics: [
      { month: 'Jul', tarefas: 0, concluidas: 0, produtividade: 0 },
      { month: 'Ago', tarefas: 0, concluidas: 0, produtividade: 0 },
      { month: 'Set', tarefas: 0, concluidas: 0, produtividade: 0 },
      { month: 'Out', tarefas: 0, concluidas: 0, produtividade: 0 },
      { month: 'Nov', tarefas: 0, concluidas: 0, produtividade: 0 },
      { month: 'Dez', tarefas: 0, concluidas: 0, produtividade: 0 }
    ],
    departmentDistribution: [
      { departamento: 'Educação', colaboradores: 0, projetos: 0 },
      { departamento: 'Saúde', colaboradores: 0, projetos: 0 },
      { departamento: 'Administrativo', colaboradores: 0, projetos: 0 },
      { departamento: 'Tecnologia', colaboradores: 0, projetos: 0 }
    ],
    satisfactionScore: [
      { mes: 'Jul', satisfacao: 0, engajamento: 0 },
      { mes: 'Ago', satisfacao: 0, engajamento: 0 },
      { mes: 'Set', satisfacao: 0, engajamento: 0 },
      { mes: 'Out', satisfacao: 0, engajamento: 0 },
      { mes: 'Nov', satisfacao: 0, engajamento: 0 },
      { mes: 'Dez', satisfacao: 0, engajamento: 0 }
    ]
  }
};