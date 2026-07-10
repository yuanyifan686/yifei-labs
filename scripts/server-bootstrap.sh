#!/usr/bin/env bash
# 在阿里云服务器上「首次」执行一次：装依赖、克隆仓库、pm2 启动
# 用法：
#   bash server-bootstrap.sh /var/www/yifei-labs 3001
set -euo pipefail

APP_PATH="${1:-/var/www/yifei-labs}"
APP_PORT="${2:-3001}"
REPO_URL="${REPO_URL:-https://github.com/yuanyifan686/yifei-labs.git}"
PM2_NAME="${PM2_NAME:-yifei-labs}"

echo "==> app path: $APP_PATH  port: $APP_PORT"

if ! command -v node >/dev/null 2>&1; then
  echo "请先安装 Node.js 20+，例如:"
  echo "  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
  echo "  sudo apt-get install -y nodejs"
  exit 1
fi

if ! command -v git >/dev/null 2>&1; then
  sudo apt-get update && sudo apt-get install -y git
fi

if ! command -v pm2 >/dev/null 2>&1; then
  sudo npm i -g pm2
fi

if [ ! -d "$APP_PATH/.git" ]; then
  sudo mkdir -p "$(dirname "$APP_PATH")"
  sudo git clone "$REPO_URL" "$APP_PATH"
  sudo chown -R "$USER:$USER" "$APP_PATH"
fi

cd "$APP_PATH"

if [ ! -f .env.production ] && [ ! -f .env.local ]; then
  echo "==> 创建 .env.production（请填入真实 Key）"
  cat > .env.production <<'EOF'
MINIMAX_API_KEY=
MINIMAX_BASE_URL=https://api.minimaxi.com/v1
AI_MODEL=MiniMax-M3
AI_MAX_CONCURRENT=3
# NEXT_PUBLIC_SUPABASE_URL=
# SUPABASE_SERVICE_ROLE_KEY=
EOF
  echo "已写入 $APP_PATH/.env.production — 请 nano 编辑后再继续 build"
  exit 0
fi

npm ci
export NEXT_TELEMETRY_DISABLED=1
npm run build

if pm2 describe "$PM2_NAME" >/dev/null 2>&1; then
  PORT="$APP_PORT" pm2 restart "$PM2_NAME" --update-env
else
  PORT="$APP_PORT" pm2 start npm --name "$PM2_NAME" -- start
fi
pm2 save
pm2 startup || true

echo "==> 完成。本机访问: curl -I http://127.0.0.1:$APP_PORT"
echo "配置 Nginx 反代后，GitHub 推送即可自动更新（见 docs/DEPLOY_ALIYUN_GITHUB.md）"
