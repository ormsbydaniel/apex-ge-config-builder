// Service worker that proxies raw.githubusercontent.com requests
// with correct MIME types for JavaScript modules and CSS.
// This is needed because raw.githubusercontent.com serves all files
// as text/plain, which browsers reject for <script type="module">.

const GITHUB_RAW_PATTERN = /^https:\/\/raw\.githubusercontent\.com\//;

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  // Only intercept requests to raw.githubusercontent.com
  if (!GITHUB_RAW_PATTERN.test(url)) {
    return;
  }

  event.respondWith(
    fetch(url).then((response) => {
      if (!response.ok) {
        return response;
      }

      // Determine correct content type based on file extension
      let contentType = response.headers.get('content-type');
      if (url.endsWith('.js') || url.endsWith('.mjs')) {
        contentType = 'application/javascript';
      } else if (url.endsWith('.css')) {
        contentType = 'text/css';
      } else if (url.endsWith('.json')) {
        contentType = 'application/json';
      } else if (url.endsWith('.wasm')) {
        contentType = 'application/wasm';
      }

      // Create new response with correct headers
      const newHeaders = new Headers(response.headers);
      newHeaders.set('Content-Type', contentType);

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    })
  );
});
