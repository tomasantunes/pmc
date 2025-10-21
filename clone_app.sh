#!/bin/bash
# =============================================================
# Clone Node.js + React App (PM2 + MySQL + Nginx + SSL)
# =============================================================

set -e

# === 1. INPUTS ===
read -p "Old app name (folder & PM2 name): " OLD_APP
read -p "New app name (folder & PM2 name): " NEW_APP
read -p "Old app port (e.g. 3000): " OLD_PORT
read -p "New app port (e.g. 3001): " NEW_PORT
read -p "New username: " NEW_USERNAME
read -p "New password: " NEW_PASSWORD
read -p "New session key: " NEW_SESSION_KEY
read -p "New Github Token: " NEW_GITHUB_TOKEN
read -p "New OpenAI API Key: " NEW_OPENAI_API_KEY
read -p "Old domain (e.g. app.example.com): " OLD_DOMAIN
read -p "New domain (e.g. new.example.com): " NEW_DOMAIN
read -p "New MySQL DB name: " DB_NAME
read -p "New MySQL DB user: " DB_USER
read -s -p "New MySQL DB password: " DB_PASS
echo

APP_DIR="/home/user1/$NEW_APP"
OLD_DIR="/home/user1/$OLD_APP"

# === 2. COPY APP ===
echo "📦 Cloning app folder..."
sudo cp -r "$OLD_DIR" "$APP_DIR"
sudo chown -R www-data:www-data "$APP_DIR"

# === 3. CREATE DATABASE ===
echo "🧱 Creating new MySQL database and user..."
sudo mysql -u root -p <<MYSQL_SCRIPT
CREATE DATABASE IF NOT EXISTS $DB_NAME;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
MYSQL_SCRIPT

# === 4. UPDATE BACKEND CONFIG.JSON ===
BACKEND_CONFIG="$APP_DIR/secret-config.json"
if [ -f "$BACKEND_CONFIG" ]; then
  echo "⚙️ Updating backend secret-config.json..."
  sudo jq \
    --arg new_user "$NEW_USERNAME" \
    --arg new_pass "$NEW_PASSWORD" \
    --arg session_key "$NEW_SESSION_KEY" \
    --arg github_token "$NEW_GITHUB_TOKEN" \
    --arg openai_api_key "$NEW_OPENAI_API_KEY" \
    --arg db_name "$DB_NAME" \
    --arg db_user "$DB_USER" \
    --arg db_pass "$DB_PASS" \
    --arg domain "$NEW_DOMAIN" \
    --argjson port "$NEW_PORT" \
    '
    .DB_NAME = $db_name |
    .DB_USER = $db_user |
    .DB_PASSWORD = $db_pass |
    .SESSION_KEY = $session_key |
    .USER = $new_user |
    .PASS = $new_pass |
    .GITHUB_TOKEN = $github_token |
    .OPENAI_API_KEY = $openai_api_key |
    .PORT = $port |
    .DOMAIN = $domain
    ' "$BACKEND_CONFIG" | sudo tee "$BACKEND_CONFIG.tmp" > /dev/null

  sudo mv "$BACKEND_CONFIG.tmp" "$BACKEND_CONFIG"
else
  echo "⚠️ Backend config.json not found — please update it manually."
fi

# === 5. UPDATE FRONTEND CONFIG.JSON ===
FRONTEND_CONFIG="$APP_DIR/frontend/src/config.json"
if [ -f "$FRONTEND_CONFIG" ]; then
  echo "🎨 Updating frontend config.json..."
  sudo jq \
    --arg base_url "https://$NEW_DOMAIN" \
    '.BASE_URL = $base_url' \
    "$FRONTEND_CONFIG" | sudo tee "$FRONTEND_CONFIG.tmp" > /dev/null

  sudo mv "$FRONTEND_CONFIG.tmp" "$FRONTEND_CONFIG"
else
  echo "⚠️ Frontend config.json not found — please update it manually."
fi

# === 6. REBUILD FRONTEND ===
echo "🏗️ Rebuilding React frontend..."
cd "$APP_DIR/frontend"
sudo npm install
sudo npm run build

# === 7. START NEW PM2 PROCESS ===
echo "🚀 Starting new PM2 process..."
cd "$APP_DIR"
pm2 start bin/www --name "$NEW_APP"
pm2 save

# === 8. CREATE NGINX CONFIG ===
echo "🌐 Creating new Nginx site..."
sudo cp "/etc/nginx/sites-available/$OLD_DOMAIN" "/etc/nginx/sites-available/$NEW_DOMAIN"
sudo sed -i "s/$OLD_DOMAIN/$NEW_DOMAIN/g" "/etc/nginx/sites-available/$NEW_DOMAIN"
sudo sed -i "s/$OLD_PORT/$NEW_PORT/g" "/etc/nginx/sites-available/$NEW_DOMAIN"
sudo ln -sf "/etc/nginx/sites-available/$NEW_DOMAIN" "/etc/nginx/sites-enabled/$NEW_DOMAIN"
sudo nginx -t && sudo systemctl reload nginx

=== 9. ISSUE SSL CERTIFICATE ===
echo "🔒 Requesting SSL certificate via Certbot..."
sudo certbot --nginx -d "$NEW_DOMAIN" --non-interactive --agree-tos -m tomasantunes@gmail.com || {
  echo "⚠️ Certbot failed — please check your DNS or run manually: certbot --nginx -d $NEW_DOMAIN"
}

echo
echo "✅ Clone complete!"
echo "--------------------------------------"
echo "App directory: $APP_DIR"
echo "Backend: port $NEW_PORT"
echo "Frontend: rebuilt successfully"
echo "New domain: https://$NEW_DOMAIN"
echo "PM2 process: $NEW_APP"
echo "MySQL DB: $DB_NAME ($DB_USER)"
echo "--------------------------------------"
