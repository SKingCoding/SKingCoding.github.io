addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const backendUrl = 'https://party-game-backend.onrender.com'

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': 'https://skingcoding.github.io',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    })
  }

  // Rewrite the request to the backend
  const modifiedRequest = new Request(backendUrl + url.pathname + url.search, {
    method: request.method,
    headers: request.headers,
    body: request.body,
  })

  try {
    const response = await fetch(modifiedRequest)
    const modifiedResponse = new Response(response.body, response)
    
    // Add CORS headers to the response
    modifiedResponse.headers.set('Access-Control-Allow-Origin', 'https://skingcoding.github.io')
    modifiedResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    modifiedResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    return modifiedResponse
  } catch (error) {
    return new Response('Error: ' + error.message, { status: 500 })
  }
} 