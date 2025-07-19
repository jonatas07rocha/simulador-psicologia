// Define o nome do cache
const CACHE_NAME = 'simulados-psi-cache-v1';

// Lista de arquivos essenciais para o funcionamento offline do app
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/bancoDeQuestoes.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@latest',
  'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/tone/14.7.77/Tone.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'
];

// Evento 'install': é disparado quando o Service Worker é instalado.
// Aqui, abrimos o cache e adicionamos os arquivos essenciais.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Evento 'fetch': é disparado para cada solicitação de rede feita pela página.
// O Service Worker intercepta a solicitação e decide o que fazer.
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se a resposta for encontrada no cache, retorna a versão em cache.
        if (response) {
          return response;
        }
        // Se não, faz a solicitação à rede.
        return fetch(event.request);
      }
    )
  );
});
