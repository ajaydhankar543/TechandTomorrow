# Deployment Lessons Learned (March 23, 2026)

## What was the problem?
Your GitHub Action showed **"deploy successful"**, but your website at `http://161.118.167.30/` was still not loading.

## What I observed
- SSH port `22` was reachable.
- Web ports (`80`, `3000`, `5173`) were not reachable from outside.
- The workflow built the frontend and restarted backend with PM2.
- But nothing guaranteed that a web server was serving your frontend on port `80`.

## Root cause (simple explanation)
A successful CI/CD pipeline means **commands ran successfully** — it does **not** always mean the app is publicly accessible.

In your case, deployment succeeded, but:
1. Frontend was built, not served to the public on port `80`.
2. Nginx/web server setup for serving `Frontend/dist` was missing.
3. Firewall/network rules also needed to allow HTTP traffic.

## Fixes applied
- Updated `.github/workflows/deploy.yml` to:
  - install/configure **Nginx**,
  - copy `Frontend/dist` to `/var/www/techandtomorrow`,
  - serve it on port `80`,
  - reload Nginx,
  - allow Nginx via UFW when active.
- Updated backend port handling in `Backend/server.js`:
  - uses `PORT` first, then fallback to `port`.

## Mistakes to avoid next time
1. **Assuming “deploy success” = “site is live.”**
2. Not verifying that port `80`/`443` are open externally.
3. Not ensuring a production web server (Nginx) is serving frontend build output.
4. Not validating runtime environment variables (like `PORT`) consistently.

## Quick post-deploy checklist
After every deployment, verify these in order:

1. Pipeline completed without errors.
2. Backend process is running (`pm2 list`).
3. Frontend build exists (`Frontend/dist`).
4. Nginx is active and config passes (`nginx -t`).
5. Firewall allows HTTP/HTTPS.
6. `http://<server-ip>/` loads in browser.

## Key learning
**Deploy success is a build/automation signal, not a traffic/reachability guarantee.**
Always do an external reachability check after deployment.
