// Firebase Messaging Service Worker
// Este arquivo é necessário para receber notificações quando o app está em background

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDKdcqxJj1qoSFpY1bLT2JloeJDfxDG_x8",
  authDomain: "clube-do-grito.firebaseapp.com",
  projectId: "clube-do-grito",
  storageBucket: "clube-do-grito.firebasestorage.app",
  messagingSenderId: "579937692596",
  appId: "1:579937692596:web:9c2dd3f21e94d3230ca0e1"
});

const messaging = firebase.messaging();

function readPushData(data) {
  var d = data || {};
  return {
    title: d.cdg_title || d.title || '',
    body: d.cdg_body || d.body || '',
    url: d.cdg_url || d.url || ''
  };
}

function pushClickPath(urlToOpen) {
  if (!urlToOpen || urlToOpen === '/') return '/';
  if (/^https?:\/\//i.test(urlToOpen)) {
    try {
      var parsed = new URL(urlToOpen);
      return parsed.pathname + parsed.search + parsed.hash;
    } catch (e) {
      return '/';
    }
  }
  return urlToOpen.startsWith('/') ? urlToOpen : '/' + urlToOpen;
}

function isPublicPushPath(path) {
  var p = (path || '/').split('?')[0].split('#')[0] || '/';
  if (p === '/') return true;
  var prefixes = [
    '/entrar', '/login/', '/dev/login',
    '/termos-servicos', '/politica-privacidade', '/reativar-assinatura',
    '/dashboard/gestao/vista', '/gestao-vista-preview',
    '/register', '/plans', '/verify', '/checkout', '/success',
    '/pos-pagamento', '/aguardando-aprovacao', '/pagamento/',
    '/assinatura-pausada'
  ];
  for (var i = 0; i < prefixes.length; i++) {
    var prefix = prefixes[i];
    if (prefix.endsWith('/')) {
      if (p.startsWith(prefix) || p === prefix.slice(0, -1)) return true;
    } else if (p === prefix || p.startsWith(prefix + '/')) {
      return true;
    }
  }
  return false;
}

function loginPathForPushTarget(path) {
  var p = (path || '/').split('?')[0];
  if (p.indexOf('/coordenador') === 0) return '/login/coordenador';
  if (p.indexOf('/professor') === 0) return '/login/professor';
  if (p.indexOf('/monitor') === 0) return '/login/monitor';
  if (p.indexOf('/aluno') === 0) return '/login/aluno';
  if (p.indexOf('/dev') === 0 || p.indexOf('/admin') === 0 || p.indexOf('/administrador') === 0) {
    return '/login/developer';
  }
  if (p.indexOf('/rbac/marketing') === 0) return '/login/marketing';
  return '/entrar';
}

// Home padrão por papel (espelha getDefaultRouteForRole no app).
function roleHome(role) {
  switch (role) {
    case 'professor': case 'professor_psico': case 'lider': case 'professor_lider': return '/professor';
    case 'professor_pec': return '/professor/pec';
    case 'professor_inclusao': return '/professor/inclusao';
    case 'monitor': case 'monitor_pec': case 'monitor_inclusao': case 'monitor_psico': return '/monitor';
    case 'coordenador_inclusao': return '/coordenador/inclusao-produtiva';
    case 'coordenador_pec': return '/coordenador/esporte-cultura';
    case 'coordenador_psico': return '/coordenador/psicossocial';
    case 'tecnica_psico': return '/tecnica/psicossocial';
    case 'super_admin': case 'leo': return '/administrador';
    case 'desenvolvedor': case 'dev': return '/dev';
    case 'dev-marketing': return '/dev/marketing';
    case 'admin': return '/admin-geral';
    case 'aluno': case 'aluno_portal': return '/aluno';
    case 'conselho': case 'conselheiro': return '/conselho';
    case 'patrocinador': return '/patrocinador';
    default: return '/tdoador';
  }
}

// Papel pode abrir a rota? Papéis elevados/desconhecidos: permissivo (ProtectedRoute confirma).
function roleAllowsPath(role, path) {
  var p = (path || '/').split('?')[0].split('#')[0] || '/';
  if (['dev', 'desenvolvedor', 'dev-admin', 'dev-marketing', 'super_admin', 'leo', 'admin'].indexOf(role) >= 0) return true;
  var map = {
    doador: ['/', '/tdoador', '/welcome', '/beneficios', '/beneficios-onboarding', '/missoes', '/missoes-semanais', '/meus-lances', '/sorteio', '/impacto', '/link-indicacao', '/link-afiliado-cadastro', '/busca', '/noticias', '/perfil', '/meus-dados', '/dados-cadastrais', '/pagamentos', '/configuracoes', '/sobre', '/change-plan', '/central-ajuda', '/reativar-assinatura'],
    aluno: ['/', '/aluno', '/central-ajuda', '/meus-dados'],
    professor: ['/', '/professor', '/central-ajuda', '/meus-dados'],
    monitor: ['/', '/monitor', '/central-ajuda', '/meus-dados'],
    coordenador: ['/', '/coordenador', '/central-ajuda', '/meus-dados', '/login/coordenador'],
    tecnica_psico: ['/', '/tecnica', '/central-ajuda', '/meus-dados'],
    conselho: ['/', '/conselho', '/central-ajuda', '/perfil', '/meus-dados', '/dados-cadastrais', '/sobre', '/configuracoes', '/gestao-vista', '/dashboard/gestao/vista'],
    patrocinador: ['/', '/patrocinador-dashboard', '/patrocinador', '/perfil-patrocinador', '/meus-dados', '/central-ajuda']
  };
  var key = role;
  if (role === 'user') key = 'doador';
  else if (role === 'aluno_portal') key = 'aluno';
  else if (role.indexOf('professor') === 0 || role === 'lider') key = 'professor';
  else if (role.indexOf('monitor') === 0) key = 'monitor';
  else if (role.indexOf('coordenador') === 0) key = 'coordenador';
  else if (role === 'conselheiro') key = 'conselho';
  var allowed = map[key];
  if (!allowed) return true; // papel não mapeado: não bloquear aqui
  for (var i = 0; i < allowed.length; i++) {
    var a = allowed[i];
    if (p === a || (a !== '/' && p.indexOf(a + '/') === 0)) return true;
  }
  return false;
}

async function fetchAuthSession() {
  try {
    var res = await fetch(self.location.origin + '/api/auth/session', {
      credentials: 'include',
      cache: 'no-store'
    });
    if (res.status === 401 || !res.ok) return null;
    var session = await res.json();
    return (session && session.id) ? session : null;
  } catch (e) {
    return null;
  }
}

async function resolveSecurePushPath(urlToOpen) {
  var path = pushClickPath(urlToOpen);
  if (isPublicPushPath(path)) return path;
  var session = await fetchAuthSession();
  if (!session) return loginPathForPushTarget(path);
  var role = String(session.papel || session.role || session.actorType || '');
  if (roleAllowsPath(role, path)) return path;
  return roleHome(role);
}

async function openPushClickUrl(urlToOpen) {
  var path = await resolveSecurePushPath(urlToOpen);
  var url = self.location.origin + path;
  var windowClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (var i = 0; i < windowClients.length; i++) {
    var client = windowClients[i];
    if (!client.url.startsWith(self.location.origin)) continue;
    if ('focus' in client) await client.focus();
    if ('navigate' in client) {
      await client.navigate(url);
      return;
    }
    client.postMessage({ type: 'PUSH_NAVIGATE', path: path });
    return;
  }
  if (clients.openWindow) await clients.openWindow(url);
}

function showPushNotification(payload) {
  var notif = payload.notification || {};
  var parsed = readPushData(payload.data);
  var title = notif.title || parsed.title || 'Clube do Grito';
  var body = notif.body || parsed.body || '';
  var urlRaw = parsed.url || (notif.data && notif.data.url);
  var clickPath = urlRaw ? pushClickPath(urlRaw) : undefined;
  var tag = payload.fcmMessageId || payload.messageId || parsed.title || 'cdg-push';

  return self.registration.showNotification(title, {
    body: body,
    icon: '/icons/icon-192.png',
    tag: String(tag).slice(0, 64),
    renotify: true,
    data: clickPath ? { url: clickPath } : {},
    vibrate: [200, 100, 200],
  });
}

messaging.onBackgroundMessage(function(payload) {
  return showPushNotification(payload);
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  if (event.action === 'close') return;

  var urlToOpen = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(openPushClickUrl(urlToOpen));
});

console.log('[firebase-messaging-sw.js] Service Worker carregado');
