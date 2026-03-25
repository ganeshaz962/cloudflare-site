# Hosting on Linux (Nginx) – Step-by-Step Guide

## Prerequisites
- A Linux VM (Ubuntu 20.04 / 22.04 recommended) — AWS EC2, Azure VM, GCP, DigitalOcean, etc.
- SSH access to the server
- A GitHub repository containing this code
- A domain name (optional but recommended)

---

## CI/CD with GitHub Actions (Recommended)

Every `git push` to `main` automatically deploys to your VM. No manual SSH needed.

### Architecture
```
Your PC  →  git push  →  GitHub  →  GitHub Actions  →  SSH → VM (Nginx serves site)
```

### One-time Setup

#### A. Push your code to GitHub
```powershell
# In PowerShell (Windows), from your project folder
cd "C:\Ganesh\Personal\cloudflare"
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

#### B. Enable password-based SSH on your VM

By default some VMs disable password login. Run this on the **VM** to allow it:
```bash
sudo nano /etc/ssh/sshd_config
```
Find and set these two lines (add them if missing):
```
PasswordAuthentication yes
PermitRootLogin yes        # only if you log in as root
```
Save, then restart SSH:
```bash
sudo systemctl restart ssh
```

#### C. Add GitHub Secrets
Go to your repo → **Settings → Secrets and variables → Actions → New repository secret**

| Secret Name   | Value |
|---|---|
| `VM_HOST`     | Your VM's public IP or domain (e.g. `203.0.113.10`) |
| `VM_USER`     | SSH username (e.g. `ganesh`, `ubuntu`, `root`) |
| `VM_PASSWORD` | Your Linux VM login password |
| `VM_PORT`     | SSH port — usually `22` (optional) |

#### D. Bootstrap the VM (first time only)
```bash
# On the VM — clone your repo and set up Nginx
sudo apt update && sudo apt install -y nginx git

sudo mkdir -p /var/www/mysite
sudo git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git /var/www/mysite
sudo chown -R www-data:www-data /var/www/mysite

# Copy and enable Nginx config
sudo cp /var/www/mysite/nginx/mysite.conf /etc/nginx/sites-available/mysite
# Edit the server_name line first:
sudo nano /etc/nginx/sites-available/mysite

sudo ln -s /etc/nginx/sites-available/mysite /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Or use the automated setup script:
```bash
# Download and run the setup script on the VM
curl -o vm-setup.sh https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/scripts/vm-setup.sh
bash vm-setup.sh
```

#### E. Allow the deploy user to run sudo git / nginx without password
```bash
# On the VM — edit sudoers so GitHub Actions can deploy without a password prompt
echo "$USER ALL=(ALL) NOPASSWD: /usr/bin/git, /usr/bin/chown, /usr/bin/chmod, /usr/sbin/nginx, /bin/systemctl reload nginx" \
  | sudo tee /etc/sudoers.d/github-deploy
```

#### F. Test the pipeline
```powershell
# On Windows — make a small change and push
git add .
git commit -m "Test CI/CD deploy"
git push
```

Then go to **GitHub → Actions tab** to watch the workflow run. A green tick means it deployed successfully.

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
