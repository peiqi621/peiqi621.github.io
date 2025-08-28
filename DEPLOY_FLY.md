# Deploy backend to Fly.io

Prerequisites:
- Install flyctl: https://fly.io/docs/hands-on/install-flyctl/
- Run `fly auth login`

One-time setup:
```bash
cd /Users/liupeiqi/workshop/Hobby/Personal_Project/Couple_Moment
# adjust app name in fly.toml if desired
```

Launch (first time):
```bash
fly launch --no-deploy --copy-config
# keep internal port 5057 when prompted
```

Secrets:
```bash
fly secrets set DEEPSEEK_API_KEY=sk-***
```

Deploy:
```bash
fly deploy
fly status
fly logs
```

Test:
```bash
APP_URL=$(fly status | awk '/Hostname/{print $2}')
curl -s https://$APP_URL/health
```

Custom domain (optional):
- Add DNS CNAME to `$APP_URL`
- Issue cert: `fly certs add api.example.com`

Frontend:
- In `index.html` add before scripts.js:
```html
<script>window.CM_API_BASE='https://api.example.com';</script>
```
- Push to GitHub Pages and hard-refresh the browser.
