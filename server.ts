import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Discord OAuth endpoints
  app.get('/api/auth/discord/url', (req, res) => {
    const appUrl = process.env.APP_URL?.replace(/\/$/, '');
    const redirectUri = req.query.redirectUri as string || (appUrl ? `${appUrl}/auth/callback` : `${req.protocol}://${req.get('host')}/auth/callback`);
    const clientId = process.env.DISCORD_CLIENT_ID;
    
    if (!clientId) {
      return res.status(500).json({ error: 'Discord Client ID not configured' });
    }

    const state = Buffer.from(JSON.stringify({ redirectUri })).toString('base64');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'identify guilds webhook.incoming',
      state: state,
    });

    const authUrl = `https://discord.com/api/oauth2/authorize?${params.toString()}`;
    res.json({ url: authUrl });
  });

  app.get('/auth/callback', async (req, res) => {
    const { code, state } = req.query;
    
    const appUrl = process.env.APP_URL?.replace(/\/$/, '');
    let redirectUri = appUrl 
      ? `${appUrl}/auth/callback`
      : `${req.headers['x-forwarded-proto'] || req.protocol}://${req.headers['x-forwarded-host'] || req.get('host')}/auth/callback`;

    if (state) {
      try {
        const decodedState = JSON.parse(Buffer.from(state as string, 'base64').toString('utf-8'));
        if (decodedState.redirectUri) {
          redirectUri = decodedState.redirectUri;
        }
      } catch (e) {
        console.error('Failed to decode state', e);
      }
    }

    if (!code) {
      return res.status(400).send('No code provided');
    }

    try {
      const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.DISCORD_CLIENT_ID || '',
          client_secret: process.env.DISCORD_CLIENT_SECRET || '',
          grant_type: 'authorization_code',
          code: code.toString(),
          redirect_uri: redirectUri,
        }),
      });

      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        console.error('Discord token error:', tokenData);
        return res.status(400).send(`Error: ${tokenData.error_description || tokenData.error}`);
      }

      // We have the token, now get user info and webhooks
      const userResponse = await fetch('https://discord.com/api/users/@me', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });
      const userData = await userResponse.json();

      // Send success message to parent window and close popup
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'OAUTH_AUTH_SUCCESS', 
                  data: {
                    user: ${JSON.stringify(userData)},
                    token: '${tokenData.access_token}',
                    webhook: ${JSON.stringify(tokenData.webhook || null)}
                  }
                }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.status(500).send('Internal Server Error');
    }
  });

  // Proxy to get user's guilds/channels/webhooks
  app.get('/api/discord/guilds', async (req, res) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const response = await fetch('https://discord.com/api/users/@me/guilds', {
        headers: { Authorization: token },
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Failed to fetch guilds:', error);
      res.status(500).json({ error: 'Failed to fetch guilds' });
    }
  });

  app.get('/api/discord/guilds/:guildId/webhooks', async (req, res) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
      // Note: This requires bot token or specific permissions which user token might not have.
      // Usually, webhooks are created via OAuth flow with 'webhook.incoming' scope,
      // which returns a single webhook in the token response.
      res.json({ error: 'Fetching all webhooks requires bot permissions. Use the webhook provided during OAuth.' });
    } catch (error) {
      console.error('Failed to fetch webhooks:', error);
      res.status(500).json({ error: 'Failed to fetch webhooks' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, '../dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
