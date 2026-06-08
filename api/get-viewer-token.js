export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const { ip } = await fetch('https://api.ipify.org?format=json').then(r => r.json());
    console.log('Vercel outbound IP:', ip); // add this ip to server allow list

    const { doc_id, pages = '*' } = req.body;
    const response = await fetch(`${process.env.BLINKDOC_API}/api/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': process.env.BLINKDOC_API_KEY,
      },
      body: JSON.stringify({
        user_email: process.env.BLINKDOC_USER_EMAIL,
        doc_id,
        pages,
        user_ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      }),
    });
  
    const data = await response.json();
    res.status(response.status).json(data);
  }