# Oracle Cloud Deployment — My Journey & Mistakes
> A personal reference doc based on deploying `techandtomorrow.social` on Oracle Cloud (Ubuntu) with Node.js + React/Vite + Nginx + PM2 + SSL

---

## 🗺️ Full Stack Overview

```
Browser
  ↓ HTTPS (port 443)
Nginx  ──→ /api  ──→ Node.js Backend (PM2, port 3000)
       ──→ /     ──→ React/Vite Frontend (dist/ folder)
```

---

## ✅ Step 1 — Install PM2 (Process Manager for Node.js)

### What I did
```bash
npm install -g pm2
```

### ❌ Error
```
EACCES: permission denied, mkdir '/usr/lib/node_modules/pm2'
```

### 🔍 Why it happened
`npm -g` tries to install into `/usr/lib/node_modules` which is owned by root. Running as a regular user doesn't have permission.

### ✅ Fix — Change npm global prefix to home directory
```bash
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
npm install -g pm2
```

### 💡 Lesson
Always set npm global prefix to your home directory on shared/cloud servers. Never use `sudo npm install -g` — it's a bad practice.

---

## ✅ Step 2 — Enable PM2 on Server Reboot

```bash
pm2 startup
# Copy and run the command it outputs, e.g.:
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu

# After starting your app:
pm2 save
```

### 💡 Lesson
Always run `pm2 save` after starting your app. Without it, PM2 forgets your processes after a reboot.

---

## ✅ Step 3 — Install and Start Nginx

```bash
sudo apt update && sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 💡 Lesson
`systemctl enable` makes nginx auto-start on reboot. Don't skip this.

---

## ✅ Step 4 — Open Firewall Ports (The Tricky Part)

Oracle Cloud has **TWO firewalls**. Both must allow port 80 and 443.

### Firewall 1 — Oracle Security List (Cloud Console)
1. Go to your instance → Networking tab → click Subnet → Security List
2. Add Ingress Rules:
   - Source: `0.0.0.0/0` | Protocol: TCP | Port: `80`
   - Source: `0.0.0.0/0` | Protocol: TCP | Port: `443`

### Firewall 2 — Ubuntu iptables (OS Level)
```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo apt install netfilter-persistent iptables-persistent -y
sudo netfilter-persistent save
```

### ❌ My Mistake — REJECT rule was blocking everything
After running `sudo iptables -L INPUT --line-numbers`, I saw:

```
5    REJECT     all  --  anywhere  anywhere  reject-with icmp-host-prohibited
6    ACCEPT     tcp  --  ...       ...       dpt:https
7    ACCEPT     tcp  --  ...       ...       dpt:http
```

**iptables processes rules top-to-bottom and stops at first match.** The REJECT rule at position 5 was blocking all traffic before the ACCEPT rules (6, 7) could fire.

### ✅ Fix
```bash
sudo iptables -D INPUT 5   # Delete the REJECT rule
sudo netfilter-persistent save
```

### 💡 Lesson
On Oracle Cloud Ubuntu images, a `REJECT all` rule is added by default. When you add ACCEPT rules, always check they are **above** the REJECT rule, not below it.

---

## ✅ Step 5 — SSL Certificate with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Pre-requisites
- Your domain's DNS A record must point to your server IP **before** running certbot
- Port 80 must be open (certbot uses it for verification)

### Auto-renewal
Certbot sets up a systemd timer automatically. Certs renew every 90 days. Verify with:
```bash
sudo certbot certificates
```

### 💡 Lesson
Certbot is free and automatic. But it **won't work** if DNS isn't pointing to your server yet. Always verify DNS first.

---

## ✅ Step 6 — Configure Nginx

### ❌ My Mistake — No nginx site config existed
After installing nginx, `/etc/nginx/sites-enabled/default` didn't exist, causing a 403 error.

### ✅ Fix — Create a site config manually

```bash
sudo nano /etc/nginx/sites-available/yourdomain.com
```

Paste this (replace paths and domain):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Serve React/Vite build
    root /home/ubuntu/YourProject/Frontend/dist;
    index index.html index.htm;

    location / {
        try_files $uri $uri/ =404;
    }

    # Proxy API requests to Node.js backend
    location /api {
        proxy_pass http://localhost:3000/;  # trailing slash strips /api prefix
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable it:
```bash
sudo ln -s /etc/nginx/sites-available/yourdomain.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 💡 Lessons
- Always validate config with `sudo nginx -t` before restarting
- The trailing `/` in `proxy_pass http://localhost:3000/` strips the `/api` prefix when forwarding to backend
- `root` must point to the **built** frontend (`dist/`), not source files

---

## ✅ Step 7 — Build and Deploy React/Vite Frontend

### ❌ My Mistake — Serving source files instead of build output
Nginx was pointing to the source directory. React/Vite source files can't be served directly — they must be compiled first.

### ✅ Fix
```bash
cd ~/YourProject/Frontend
npm install
npm run build
# This creates a dist/ folder with compiled static files
```

Then update nginx `root` to:
```nginx
root /home/ubuntu/YourProject/Frontend/dist;
```

### 💡 Lesson
Always build your frontend before deploying. The `dist/` folder is what nginx serves, not `src/`.

---

## ✅ Step 8 — Start Backend with PM2

```bash
cd ~/YourProject/Backend
npm install
pm2 start server.js --name backend
pm2 save
```

### Check status and logs
```bash
pm2 status
pm2 logs backend
```

### ❌ My Mistake — Wrong port in nginx config
My backend was running on port `3000` but nginx was proxying to port `5000`.

### ✅ Fix
Check what port your backend is actually running on:
```bash
pm2 logs backend   # Look for "listening on port XXXX"
# or
sudo ss -tlnp | grep node
```

Then update nginx proxy_pass to match.

### 💡 Lesson
Always confirm which port your backend is actually running on before configuring nginx.

---

## 🔧 Useful Debug Commands

| Problem | Command |
|---|---|
| Is nginx running? | `sudo systemctl status nginx` |
| Is port 80/443 open? | `sudo ss -tlnp \| grep :80` |
| Check iptables rules | `sudo iptables -L INPUT --line-numbers` |
| Test nginx config | `sudo nginx -t` |
| Is backend reachable? | `curl http://localhost:3000` |
| Check SSL cert | `sudo certbot certificates` |
| PM2 process status | `pm2 status` |
| PM2 logs | `pm2 logs backend` |
| Test HTTPS via curl | `curl https://yourdomain.com/api` |

---

## 📋 Complete Deployment Checklist

- [ ] Set npm global prefix to home dir
- [ ] Install PM2 globally
- [ ] Install nginx
- [ ] Open ports 80 & 443 in Oracle Security List
- [ ] Open ports 80 & 443 in iptables (check REJECT rule position!)
- [ ] Point domain DNS A record to server IP
- [ ] Install certbot and get SSL certificate
- [ ] Build frontend (`npm run build`)
- [ ] Create nginx site config pointing to `dist/`
- [ ] Enable nginx site config with symlink
- [ ] Start backend with PM2
- [ ] Confirm backend port matches nginx proxy_pass
- [ ] Run `pm2 save` and `pm2 startup`
- [ ] Test HTTP → HTTPS redirect
- [ ] Test frontend loads
- [ ] Test `/api` route

---

## 🧠 Key Concepts to Remember

1. **iptables is ordered** — rules are checked top-to-bottom. A REJECT rule above your ACCEPT rules will block everything.
2. **Oracle Cloud has two firewalls** — cloud-level Security List AND OS-level iptables. Both must be configured.
3. **Vite/React must be built** — nginx serves static files from `dist/`, never from `src/`.
4. **PM2 needs `pm2 save`** — without saving, processes don't survive reboots.
5. **Certbot needs DNS first** — domain must point to your server IP before requesting a certificate.
6. **Trailing slash in proxy_pass matters** — `proxy_pass http://localhost:3000/` strips the location prefix; without it, `/api/users` becomes `/api/users` on the backend instead of `/users`.
