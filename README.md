# Testing the blinkDoc Embed on Free Hosting Platforms

You need two things to test the embed: a **hosted backend** (to call `POST /api/session` with your API key server-side) and a **hosted HTML page** (to load `embed.js`). Pure static hosts like GitHub Pages don't work because your API key would be exposed in the browser.


## Vercel (serverless)

Vercel deploys from GitHub and gives you a clean `https://your-project.vercel.app` URL. A bit more setup but the result is more stable (no sleeping).

### Setup

1. Create a new GitHub repo with this structure:
   ```
   my-blinkdoc-test/
     api/
       get-viewer-token.js   ← serverless function
     public/
       index.html            ← test page
     vercel.json
   ```

2. `api/get-viewer-token.js`:

```js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

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
```

3. `public/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>blinkDoc Embed Test</title>
  <style>body { font-family: sans-serif; padding: 20px; }</style>
</head>
<body>
  <h1>blinkDoc Embed Test</h1>
  <div
    data-blinkdoc-doc-id="YOUR_DOC_UUID_HERE"
    data-blinkdoc-session-url="/api/get-viewer-token"
  ></div>
  <script src="https://api.yourdomain.com/static/embed.js"></script>
</body>
</html>
```

4. `vercel.json`:

```json
{
  "rewrites": [{ "source": "/api/(.*)", "destination": "/api/$1" }]
}
```

5. Push to GitHub → go to [vercel.com](https://vercel.com) → **Import Project** → select your repo.

   > **IP allowlist:** Vercel's serverless functions make outbound requests from a fixed set of IP addresses. You must add Vercel's outbound IPs to blinkDoc's server allowlist, otherwise the `POST /api/session` call will be blocked. The current Vercel outbound IP is logged to the Vercel function logs on each request (look for `Vercel outbound IP:` in the `get-viewer-token` function log). Add that IP in the blinkDoc admin under Settings → Allowed IPs (or equivalent).

6. Under **Environment Variables** in the Vercel dashboard, add:
   ```
   BLINKDOC_API       = https://api.yourdomain.com
   BLINKDOC_API_KEY   = bdk_your_api_key_here
   BLINKDOC_DOC_ID    = your-document-uuid
   BLINKDOC_USER_EMAIL = your-test-user@example.com
   ```

7. Deploy. Your test URL is `https://your-project.vercel.app`.

---

## Things to check on any platform

Once you have the page loading, run through this checklist:

### Basic render
- [ ] The iframe appears and the PDF loads
- [ ] Your watermark is visible on the tiles
- [ ] Prev/Next buttons and the page number input work
- [ ] Zoom controls work

### Progress tracking
- [ ] Navigate to a page other than 1 (e.g. page 5)
- [ ] Wait 3 seconds — open browser Network tab and confirm `PUT /api/session/progress` fired with body `{"page":5}`
- [ ] Hard-reload the page (`Ctrl+Shift+R`)
- [ ] Viewer should open directly at page 5, not page 1

### Error cases
- [ ] What happens if the user isn't enrolled? (Remove the permission in blinkDoc admin, reload) — should show "Document unavailable."
- [ ] What happens with a bad doc ID? — should show "Document unavailable." and log to the console

### Browser console
- No JS errors at all during normal use
- `[blinkDoc]` errors only appear when something is genuinely wrong

---

## Common issues

**Viewer iframe is blank / "Refused to display in frame"**  
Your blinkDoc org's CSP `frame-ancestors` setting may be blocking the test domain. In the blinkDoc admin under Settings → Viewer Origins, either enable "Allow all origins" or add the test platform domain (e.g. `https://your-project.glitch.me`).

**Token endpoint returns 404 from blinkDoc**  
The `user_email` in your `.env` doesn't match any user in blinkDoc for your org. Create the user and add a permission via the admin panel.

**Token endpoint returns 403 from blinkDoc**  
The user exists but has no permission for the document. Add a permission in the admin under Permissions → Grant Access.

**`fetch` error in Glitch/Replit logs saying "connection refused"**  
Your `BLINKDOC_API` URL is wrong, or the blinkDoc server isn't reachable from the internet. Verify `https://api.yourdomain.com/health` responds in a browser.

**Progress not saving (no `PUT /api/session/progress` in Network tab)**  
The debounce is 2 seconds after the page finishes loading. Make sure you're waiting long enough, and that the viewer JWT hasn't expired (session TTL is ~60 seconds — the viewer refreshes automatically, so this should be fine for a normal reading session).
