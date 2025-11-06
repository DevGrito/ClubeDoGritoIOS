const { db } = require('../server/db.ts');
const { 
  projects,
  pecActivities,
  activityInstances,
  staffAssignments,
  enrollments,
  sessions,
  attendance,
  users
} = require('../shared/schema.ts');

async function createPECSeeds() {
  console.log('🌱 Iniciando seeds PEC...');

  try {
    // 1. Criar um projeto
    console.log('📁 Criando projeto...');
    const [project] = await db.insert(projects).values({
      name: 'Casa Sonhar Patrimar 2025',
      description: 'Espaço educativo voltado para o desenvolvimento integral de crianças e adolescentes através de atividades socioeducativas, culturais e esportivas.',
      category: 'SCFV',
      who_can_participate: 'Crianças e adolescentes de 6 a 17 anos da comunidade',
      period_start: '2025-01-01',
      period_end: '2025-12-31'
    }).returning();

    console.log(`✅ Projeto criado: ${project.name} (ID: ${project.id})`);

    // 2. Criar uma atividade
    console.log('🎯 Criando atividade...');
    const [activity] = await db.insert(pecActivities).values({
      project_id: project.id,
      name: 'Contraturno',
      description: 'Atividades educativas e recreativas no período oposto ao escolar, oferecendo suporte pedagógico, atividades lúdicas e desenvolvimento de habilidades socioemocionais.',
      period: 'matutino',
      control_presence: true,
      status: 'ativa'
    }).returning();

    console.log(`✅ Atividade criada: ${activity.name} (ID: ${activity.id})`);

    // 3. Criar uma instância de atividade (turma)
    console.log('👥 Criando turma...');
    const [instance] = await db.insert(activityInstances).values({
      activity_id: activity.id,
      title: 'Contraturno Manhã M1 2025 | 6–8 anos',
      code: 'M1',
      location: 'Casa Sonhar Patrimar',
      situation: 'execucao',
      period_label: 'matutino',
      age_min: 6,
      age_max: 8,
      occurrence_start: '2025-09-01',
      occurrence_end: '2025-11-30',
      expected_total_hours: 120,
      notes: 'Turma voltada para crianças de 6 a 8 anos com foco em desenvolvimento educativo e social',
      created_on: '2025-09-01'
    }).returning();

    console.log(`✅ Turma criada: ${instance.title} (ID: ${instance.id})`);

    // 4. Criar usuários para usar como inscritos (se não existirem)
    console.log('👶 Criando usuários para inscritos...');
    
    const nomes = [
      ['Arthur', 'Augusto Silva', 'masculino', '2017-03-15'],
      ['Beatriz', 'Santos Costa', 'feminino', '2016-08-22'],
      ['Carlos', 'Eduardo Oliveira', 'masculino', '2017-01-10'],
      ['Diana', 'Maria Ferreira', 'feminino', '2016-11-05'],
      ['Eduardo', 'José Lima', 'masculino', '2017-06-18'],
      ['Fernanda', 'Alves Pereira', 'feminino', '2016-09-30'],
      ['Gabriel', 'Lucas Rodrigues', 'masculino', '2017-02-14'],
      ['Helena', 'Cristina Martins', 'feminino', '2016-12-08'],
      ['Igor', 'Henrique Souza', 'masculino', '2017-04-25'],
      ['Juliana', 'Aparecida Carvalho', 'feminino', '2016-10-12'],
      ['Kaique', 'Roberto Mendes', 'masculino', '2017-07-03'],
      ['Larissa', 'Fernandes Barbosa', 'feminino', '2016-05-20']
    ];

    const createdUsers = [];
    
    for (const [nome, sobrenome, genero, nascimento] of nomes) {
      // Verificar se o usuário já existe pelo nome completo
      const existingUser = await db.select()
        .from(users)
        .where(`nome = '${nome}' AND sobrenome = '${sobrenome}'`)
        .limit(1);

      let user;
      
      if (existingUser.length === 0) {
        // Criar novo usuário
        const [newUser] = await db.insert(users).values({
          cpf: `000000000${String(createdUsers.length + 1).padStart(2, '0')}`,
          nome,
          sobrenome,
          telefone: `11999${String(createdUsers.length + 1).padStart(6, '0')}`,
          email: `${nome.toLowerCase()}.${sobrenome.toLowerCase().replace(' ', '.')}@exemplo.com`,
          verificado: true,
          ativo: true,
          role: 'aluno',
          tipo: 'aluno'
        }).returning();
        user = newUser;
      } else {
        user = existingUser[0];
      }
      
      createdUsers.push({ user, genero, nascimento });
    }

    console.log(`✅ ${createdUsers.length} usuários preparados para inscrições`);

    // 5. Criar inscrições
    console.log('📝 Criando inscrições...');
    
    const enrollmentData = [];
    
    for (const { user, genero, nascimento } of createdUsers) {
      const [enrollment] = await db.insert(enrollments).values({
        activity_instance_id: instance.id,
        person_id: user.id,
        gender: genero,
        birthdate: nascimento,
        enrollment_date: '2025-09-01',
        active: true
      }).returning();
      
      enrollmentData.push(enrollment);
    }

    console.log(`✅ ${enrollmentData.length} inscrições criadas`);

    // 6. Criar sessões para setembro 2025
    console.log('📅 Criando sessões...');
    
    const sessionDates = [
      '2025-09-02', '2025-09-04', '2025-09-06', '2025-09-09', '2025-09-11',
      '2025-09-13', '2025-09-16', '2025-09-18', '2025-09-20', '2025-09-23'
    ];

    const sessionDescriptions = [
      'Aula de circo e introdução ao tema do mês: "Descobrindo Talentos"',
      'Atividades de arte e pintura com materiais recicláveis',
      'Jogos educativos e desenvolvimento da coordenação motora',
      'Contação de histórias e dramatização',
      'Oficina de música e ritmo com instrumentos alternativos',
      'Atividades de jardinagem e cuidado com o meio ambiente',
      'Brincadeiras tradicionais e cultura popular',
      'Oficina de culinária saudável',
      'Atividades esportivas e trabalho em equipe',
      'Feira de talentos - apresentação das crianças'
    ];

    const createdSessions = [];
    
    for (let i = 0; i < sessionDates.length; i++) {
      const [session] = await db.insert(sessions).values({
        activity_instance_id: instance.id,
        date: sessionDates[i],
        hours: '3.00',
        title: sessionDescriptions[i],
        description: sessionDescriptions[i],
        observations: i % 3 === 0 ? 'Excelente participação das crianças' : 
                     i % 3 === 1 ? 'Algumas crianças chegaram atrasadas devido ao transporte' : 
                     'Sem observações especiais',
        status: 'realizado',
        location: 'Casa Sonhar Patrimar',
        educator_names: i % 2 === 0 ? 'Maria Silva, João Santos' : 'Ana Costa, Pedro Oliveira'
      }).returning();
      
      createdSessions.push(session);
    }

    console.log(`✅ ${createdSessions.length} sessões criadas`);

    // 7. Criar registros de presença distribuídos
    console.log('✅ Criando registros de presença...');
    
    let totalAttendanceRecords = 0;
    
    for (const session of createdSessions) {
      for (const enrollment of enrollmentData) {
        // Simular presença: 85% de chance de estar presente
        // Algumas crianças têm maior frequência que outras
        const childFrequency = 0.7 + (enrollment.id % 3) * 0.1; // 70%, 80%, ou 90%
        const isPresent = Math.random() < childFrequency;
        
        await db.insert(attendance).values({
          session_id: session.id,
          enrollment_id: enrollment.id,
          present: isPresent
        });
        
        totalAttendanceRecords++;
      }
    }

    console.log(`✅ ${totalAttendanceRecords} registros de presença criados`);

    console.log('\n🎉 Seeds PEC criados com sucesso!');
    console.log(`📊 Resumo:`);
    console.log(`   • 1 Projeto: ${project.name}`);
    console.log(`   • 1 Atividade: ${activity.name}`);
    console.log(`   • 1 Turma: ${instance.title}`);
    console.log(`   • ${enrollmentData.length} Inscritos`);
    console.log(`   • ${createdSessions.length} Sessões (Setembro 2025)`);
    console.log(`   • ${totalAttendanceRecords} Registros de Presença`);
    
  } catch (error) {
    console.error('❌ Erro ao criar seeds:', error);
    throw error;
  }
}

// Executar seeds se chamado diretamente
if (require.main === module) {
  createPECSeeds()
    .then(() => {
      console.log('✅ Seeds executados com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Falha ao executar seeds:', error);
      process.exit(1);
    });
}

module.exports = createPECSeeds;