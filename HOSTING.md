# Hosting on Linux (Nginx) – Step-by-Step Guide

## Prerequisites
- A Linux VM (Ubuntu 20.04 / 22.04 recommended) — AWS EC2, Azure VM, GCP, DigitalOcean, etc.
- SSH access to the server
- A GitHub repository containing this code
- A domain name (optional but recommended)

---

## CI/CD with GitHub Actions – Self-Hosted Runner (Private IP VM)

Since the VM has only a **private IP**, GitHub Actions cannot SSH into it.
Instead, install a **self-hosted runner** on the VM — it connects *outward* to GitHub
over HTTPS (port 443). No inbound port needs to be opened for CI/CD.

The **Application Gateway** is configured separately for inbound HTTP/HTTPS traffic from users.

### Architecture
```
Your PC → git push → GitHub → GitHub Actions (runner on VM pulls & deploys) → Nginx
                                    ↑
                          VM connects OUT to GitHub
                          (only outbound HTTPS needed)

Users → Application Gateway (public IP) → VM private IP → Nginx
```

### One-time Setup

#### A. Push your code to GitHub
```powershell
cd "C:\Ganesh\Personal\cloudflare"
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

#### B. Install Nginx & rsync on the VM
```bash
sudo apt update && sudo apt install -y nginx rsync
sudo systemctl enable nginx && sudo systemctl start nginx
```

#### C. Install the GitHub Actions self-hosted runner on the VM

1. Go to your GitHub repo → **Settings → Actions → Runners → New self-hosted runner**
2. Select **Linux** and **x64**
3. Copy and run the commands GitHub shows — they look like this:

```bash
# Create a dedicated directory for the runner
mkdir -p ~/actions-runner && cd ~/actions-runner

# Download (use the exact version/URL from the GitHub UI)
curl -o actions-runner-linux-x64.tar.gz -L \
  https://github.com/actions/runner/releases/download/vX.X.X/actions-runner-linux-x64-X.X.X.tar.gz

tar xzf ./actions-runner-linux-x64.tar.gz

# Configure (use the token from the GitHub UI — it expires in 1 hour)
./config.sh --url https://github.com/YOUR_USERNAME/YOUR_REPO --token YOUR_TOKEN
```

#### D. Run the runner as a background service (survives reboots)
```bash
# Still in ~/actions-runner
sudo ./svc.sh install
sudo ./svc.sh start
sudo ./svc.sh status    # should show: active (running)
```

#### E. Allow the runner user to deploy without a password prompt
```bash
# Replace 'ganesh' with the Linux username that runs the runner
echo "ganesh ALL=(ALL) NOPASSWD: /usr/bin/rsync, /usr/bin/chown, /usr/bin/chmod, /bin/systemctl reload nginx" \
  | sudo tee /etc/sudoers.d/github-runner
sudo chmod 440 /etc/sudoers.d/github-runner
```

#### F. Set up the Nginx web root
```bash
sudo mkdir -p /var/www/mysite
sudo chown -R www-data:www-data /var/www/mysite

# Copy Nginx config
sudo cp ~/actions-runner/_work/*/mysite/nginx/mysite.conf \
        /etc/nginx/sites-available/mysite

# Edit server_name — use the VM's private IP (App Gateway proxies to this)
sudo nano /etc/nginx/sites-available/mysite

sudo ln -sf /etc/nginx/sites-available/mysite /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

#### G. Test the pipeline
```powershell
# On Windows — push any change
git add . ; git commit -m "Test CI/CD" ; git push
```

Go to **GitHub → Actions tab** — the job will run on your VM runner and deploy automatically.

---

## Application Gateway Setup (expose VM to the internet)

Once CI/CD works, add an Application Gateway (or Load Balancer) in front of the VM:

| Setting | Value |
|---|---|
| Backend pool | VM's **private IP**, port `80` |
| Health probe | HTTP GET `/` on port `80` |
| Listener | HTTP port `80` (and HTTPS port `443` with your cert) |
| Routing rule | Forward all traffic to the backend pool |

> The VM's Nginx `server_name` can be set to `_` (catch-all) since the
> Application Gateway handles the public domain name.

---

---

## Step 1 – Install Nginx

```bash
sudo apt update
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

Verify it's running:
```bash
sudo systemctl status nginx
```

---

## Step 2 – Copy Your Website Files to the Server

### Option A: Using SCP (from your Windows machine)
Open PowerShell / CMD on your Windows PC and run:

```powershell
# Replace user@YOUR_SERVER_IP with your actual credentials
scp -r "C:\Ganesh\Personal\cloudflare\*" user@YOUR_SERVER_IP:/tmp/mysite/
```

### Option B: Using Git (recommended for easy updates)
On the server:
```bash
sudo apt install -y git
cd /var/www
sudo git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git mysite
```

---

## Step 3 – Place Files in the Web Root

```bash
# Create the web root directory
sudo mkdir -p /var/www/mysite

# If you used SCP:
sudo cp -r /tmp/mysite/* /var/www/mysite/

# Set correct ownership
sudo chown -R www-data:www-data /var/www/mysite
sudo chmod -R 755 /var/www/mysite
```

---

## Step 4 – Configure Nginx

Create a new site configuration file:

```bash
sudo nano /etc/nginx/sites-available/mysite
```

Paste the following (edit `server_name` to match your domain or IP):

```nginx
server {
    listen 80;
    listen [::]:80;

    server_name YOUR_DOMAIN_OR_IP;   # e.g. ganesh.example.com or 192.168.1.100

    root /var/www/mysite;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|webp|ico|css|js|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Content-Type-Options "nosniff";
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
}
```

Enable the site and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/mysite /etc/nginx/sites-enabled/
sudo nginx -t        # test config – must say "ok"
sudo systemctl reload nginx
```

---

## Step 5 – Open the Firewall

```bash
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

---

## Step 6 – Add HTTPS with Let's Encrypt (optional but strongly recommended)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d YOUR_DOMAIN
```

Certbot will auto-configure SSL and set up automatic renewal.

Test renewal:
```bash
sudo certbot renew --dry-run
```

---

## Step 7 – Add Your Photos

1. Copy photos to your server:
   ```bash
   scp "C:\Ganesh\Personal\cloudflare\photos\*.jpg" user@YOUR_SERVER_IP:/var/www/mysite/photos/
   ```

2. Edit `index.html` on the server (or locally and re-upload):
   Uncomment / add `<div class="gallery-item">` blocks inside `#gallery-grid`.

3. Fix permissions after adding files:
   ```bash
   sudo chown -R www-data:www-data /var/www/mysite/photos/
   ```

---

## Updating the Site Later

```bash
# If using SCP each time:
scp -r "C:\Ganesh\Personal\cloudflare\*" user@YOUR_SERVER_IP:/var/www/mysite/

# If using Git:
cd /var/www/mysite
sudo git pull
```

---

## Final Folder Structure on the Server

```
/var/www/mysite/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── main.js
└── photos/
    ├── README.md
    └── (your photos here)
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Nginx won't start | Run `sudo nginx -t` to check config errors |
| 403 Forbidden | Check file permissions: `sudo chmod -R 755 /var/www/mysite` |
| 404 Not Found | Confirm `root` path in config matches actual directory |
| Photos not showing | Verify filenames match exactly (case-sensitive on Linux) |
