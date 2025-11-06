#!/usr/bin/env tsx

/**
 * Script de teste de sanidade para Cielo API 3.0
 * Testa as rotas principais sem fazer transações reais
 */

import 'dotenv/config';

const BASE_URL = process.env.PUBLIC_URL || 'http://localhost:5000';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
}

const results: TestResult[] = [];

async function testCieloStatus() {
  try {
    const response = await fetch(`${BASE_URL}/api/admin/cielo/status`);
    const data = await response.json();
    
    if (response.ok) {
      if (data.configured) {
        results.push({
          name: 'Status Cielo',
          status: 'PASS',
          message: '✅ Credenciais configuradas'
        });
      } else {
        results.push({
          name: 'Status Cielo',
          status: 'SKIP',
          message: '⚠️ Credenciais não configuradas (configure via /admin/cielo/credenciais)'
        });
      }
    } else {
      results.push({
        name: 'Status Cielo',
        status: 'FAIL',
        message: `❌ Erro: ${response.status}`
      });
    }
  } catch (error: any) {
    results.push({
      name: 'Status Cielo',
      status: 'FAIL',
      message: `❌ Erro: ${error.message}`
    });
  }
}

async function testCardBrandDetection() {
  try {
    // Testar importação do helper
    const { detectCardBrand } = await import('../server/lib/cardBrand.ts');
    
    const tests = [
      { number: '4532117080573700', expected: 'Visa' },
      { number: '5448280000000007', expected: 'Master' },
      { number: '6362970000457013', expected: 'Elo' }
    ];
    
    let allPass = true;
    for (const test of tests) {
      const result = detectCardBrand(test.number);
      if (result !== test.expected) {
        allPass = false;
        console.log(`  ❌ ${test.number}: esperado ${test.expected}, obteve ${result}`);
      }
    }
    
    if (allPass) {
      results.push({
        name: 'Detecção de Bandeira',
        status: 'PASS',
        message: '✅ Todas as bandeiras detectadas corretamente'
      });
    } else {
      results.push({
        name: 'Detecção de Bandeira',
        status: 'FAIL',
        message: '❌ Algumas bandeiras não foram detectadas corretamente'
      });
    }
  } catch (error: any) {
    results.push({
      name: 'Detecção de Bandeira',
      status: 'FAIL',
      message: `❌ Erro: ${error.message}`
    });
  }
}

async function testCieloRoutes() {
  const routes = [
    { method: 'GET', path: '/api/admin/cielo/status', name: 'Admin Status' }
  ];
  
  for (const route of routes) {
    try {
      const response = await fetch(`${BASE_URL}${route.path}`, {
        method: route.method
      });
      
      if (response.ok || response.status === 304) {
        results.push({
          name: `Rota: ${route.name}`,
          status: 'PASS',
          message: `✅ ${route.method} ${route.path}`
        });
      } else {
        results.push({
          name: `Rota: ${route.name}`,
          status: 'FAIL',
          message: `❌ ${route.method} ${route.path} - Status: ${response.status}`
        });
      }
    } catch (error: any) {
      results.push({
        name: `Rota: ${route.name}`,
        status: 'FAIL',
        message: `❌ ${route.method} ${route.path} - Erro: ${error.message}`
      });
    }
  }
}

async function testEnvironmentVariables() {
  const requiredVars = [
    'CIELO_ENV',
    'INGRESSO_UNIT_PRICE_CENTS',
    'CIELO_SOFT_DESCRIPTOR'
  ];
  
  let allPresent = true;
  const missing: string[] = [];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      allPresent = false;
      missing.push(varName);
    }
  }
  
  if (allPresent) {
    results.push({
      name: 'Variáveis de Ambiente',
      status: 'PASS',
      message: `✅ Todas as variáveis configuradas (${requiredVars.join(', ')})`
    });
  } else {
    results.push({
      name: 'Variáveis de Ambiente',
      status: 'FAIL',
      message: `❌ Variáveis faltando: ${missing.join(', ')}`
    });
  }
}

async function main() {
  console.log('\n🔵 TESTE DE SANIDADE - CIELO API 3.0\n');
  console.log('='.repeat(60));
  
  // Executar testes
  await testEnvironmentVariables();
  await testCardBrandDetection();
  await testCieloStatus();
  await testCieloRoutes();
  
  // Exibir resultados
  console.log('\n📊 RESULTADOS:\n');
  
  let passCount = 0;
  let failCount = 0;
  let skipCount = 0;
  
  for (const result of results) {
    console.log(`${result.status === 'PASS' ? '✅' : result.status === 'SKIP' ? '⚠️' : '❌'} ${result.name}: ${result.message}`);
    
    if (result.status === 'PASS') passCount++;
    else if (result.status === 'FAIL') failCount++;
    else if (result.status === 'SKIP') skipCount++;
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`\n📈 RESUMO: ${passCount} passou, ${failCount} falhou, ${skipCount} pulou\n`);
  
  // Exit code
  process.exit(failCount > 0 ? 1 : 0);
}

main().catch(console.error);
