#!/bin/bash
# =============================================================
# vm-setup.sh  –  One-time VM bootstrap script
# Run this ONCE on your Linux VM after creating it.
# Usage:  bash vm-setup.sh
# =============================================================
set -e

REPO_URL="https://github.com/YOUR_USERNAME/YOUR_REPO.git"   # ← change this
SITE_DIR="/var/www/mysite"
NGINX_CONF="mysite"
GITHUB_DEPLOY_USER="github-deploy"

echo "============================================"
echo " Step 1 – System update & install packages"
echo "============================================"
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx git curl ufw

echo "============================================"
echo " Step 2 – Create deploy user for GitHub Actions"
echo "============================================"
# Creates a system user that GitHub Actions SSH into
if ! id "$GITHUB_DEPLOY_USER" &>/dev/null; then
  sudo adduser --disabled-password --gecos "" $GITHUB_DEPLOY_USER
  echo "$GITHUB_DEPLOY_USER ALL=(ALL) NOPASSWD: /usr/bin/git, /usr/bin/chown, /usr/bin/chmod, /usr/bin/find, /usr/sbin/nginx, /usr/bin/systemctl reload nginx" \
    | sudo tee /etc/sudoers.d/$GITHUB_DEPLOY_USER
fi

# Set up SSH authorized_keys for deploy user
# Paste your PUBLIC key here (or let GitHub Actions generate one)
sudo mkdir -p /home/$GITHUB_DEPLOY_USER/.ssh
sudo touch /home/$GITHUB_DEPLOY_USER/.ssh/authorized_keys
sudo chmod 700 /home/$GITHUB_DEPLOY_USER/.ssh
sudo chmod 600 /home/$GITHUB_DEPLOY_USER/.ssh/authorized_keys
sudo chown -R $GITHUB_DEPLOY_USER:$GITHUB_DEPLOY_USER /home/$GITHUB_DEPLOY_USER/.ssh

echo ""
echo ">>> ACTION REQUIRED: Add your GitHub Actions PUBLIC SSH key to:"
echo "    /home/$GITHUB_DEPLOY_USER/.ssh/authorized_keys"
echo ""

echo "============================================"
echo " Step 3 – Clone the repository"
echo "============================================"
sudo mkdir -p $SITE_DIR
sudo git clone $REPO_URL $SITE_DIR
sudo chown -R www-data:www-data $SITE_DIR
sudo chmod -R 755 $SITE_DIR

# Allow deploy user to run git in site dir
sudo chown -R $GITHUB_DEPLOY_USER:www-data $SITE_DIR
sudo chmod -R g+w $SITE_DIR
sudo git config --global --add safe.directory $SITE_DIR

echo "============================================"
echo " Step 4 – Configure Nginx"
echo "============================================"
sudo cp $SITE_DIR/nginx/mysite.conf /etc/nginx/sites-available/$NGINX_CONF

echo ""
echo ">>> ACTION REQUIRED: Edit /etc/nginx/sites-available/$NGINX_CONF"
echo "    Replace YOUR_DOMAIN_OR_VM_IP with your actual IP or domain."
echo ""
read -p "Press Enter once you've edited the Nginx config to continue..."

sudo ln -sf /etc/nginx/sites-available/$NGINX_CONF \
            /etc/nginx/sites-enabled/$NGINX_CONF

# Remove default site to avoid conflicts
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx

echo "============================================"
echo " Step 5 – Configure Firewall"
echo "============================================"
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
sudo ufw status

echo "============================================"
echo " Step 6 – (Optional) HTTPS via Let's Encrypt"
echo "============================================"
echo "Run the following when your domain DNS is pointing to this VM:"
echo "  sudo apt install -y certbot python3-certbot-nginx"
echo "  sudo certbot --nginx -d YOUR_DOMAIN"
echo ""

echo "============================================"
echo " VM Setup Complete!"
echo "============================================"
echo "Site is live at: http://$(curl -s ifconfig.me)"
echo ""
echo "Next: Push a commit to GitHub and watch the Actions tab deploy automatically."
