// netlify/functions/air-quality.js
// ─────────────────────────────────────────────────────────────
// Proxy function: keeps the real AWS endpoint out of public HTML.
// Set AIR_QUALITY_API_URL in Netlify UI → Site settings → Environment.
//
// Browser calls:  GET /api/air-quality   (redirected by netlify.toml)
// This function:  GET $AIR_QUALITY_API_URL  (server-side, env var)
// ─────────────────────────────────────────────────────────────

exports.handler = async function (event) {
  const API_URL = process.env.AIR_QUALITY_API_URL;

  if (!API_URL) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'AIR_QUALITY_API_URL not configured' }),
    };
  }

  // Only allow GET
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const res = await fetch(API_URL, {
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) {
      return {
        statusCode: res.status,
        body: JSON.stringify({ error: `Upstream error: ${res.status}` }),
      };
    }

    const data = await res.json();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        // Allow the landing page origin to call this
        'Access-Control-Allow-Origin': 'https://airegpt.ai',
        // Cache upstream data for 60 seconds at the CDN
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: 'Failed to fetch air quality data', detail: err.message }),
    };
  }
};
