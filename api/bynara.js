// POST /api/bynara — Vercel Serverless Function (Node.js)
// Proxy ke NaraRouter agar browser tidak kena CORS dan key tidak hardcode di HTML.
//
// Request : POST JSON { model?, messages[], ... , apiKey? }
// Key     : header "Authorization: Bearer <BYNARA_API_KEY>" (prioritas),
//           lalu body.apiKey, lalu env BYNARA_API_KEY.
// Response: JSON mentah dari upstream (status diteruskan apa adanya).

const UPSTREAM = 'https://router.bynara.id/v1/chat/completions';
const DEFAULT_MODEL = 'agnes-2.5-flash';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed, use POST' });
  }

  const auth = req.headers.authorization || '';
  const apiKey =
    auth.replace(/^Bearer\s+/i, '').trim() ||
    (req.body && req.body.apiKey) ||
    process.env.BYNARA_API_KEY ||
    '';

  if (!apiKey) {
    return res
      .status(401)
      .json({ error: 'Missing BYNARA_API_KEY (send Authorization: Bearer <key>)' });
  }

  const { model = DEFAULT_MODEL, messages, apiKey: _drop, ...rest } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Missing messages[]' });
  }

  try {
    const upstream = await fetch(UPSTREAM, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + apiKey,
      },
      body: JSON.stringify({ model, messages, ...rest }),
    });
    const data = await upstream.json().catch(() => ({}));
    return res.status(upstream.status).json(data);
  } catch (e) {
    return res.status(502).json({ error: 'Upstream unreachable', detail: e.message });
  }
};
