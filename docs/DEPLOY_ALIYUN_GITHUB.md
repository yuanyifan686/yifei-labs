# 阿里云 + GitHub Actions 自动部署

目标：你往 GitHub 推代码 → Actions 自动 SSH 到阿里云 → `git pull` + `npm ci` + `build` + `pm2 restart`。

适合：ECS / 轻量应用服务器，已有服务占用 **3000** 时，本项目用 **3001**。

---

## 总览

```text
你 push → GitHub Actions → SSH 阿里云 → 更新代码并重启 pm2
密钥 / MiniMax Key 只放在服务器 .env.production，不进仓库
```

---

## 一、服务器首次准备（只做一次）

SSH 登录阿里云：

```bash
# 1) Node 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git

# 2) pm2
sudo npm i -g pm2

# 3) 克隆（目录可自定义）
sudo mkdir -p /var/www
sudo git clone https://github.com/yuanyifan686/yifei-labs.git /var/www/yifei-labs
sudo chown -R $USER:$USER /var/www/yifei-labs
cd /var/www/yifei-labs

# 4) 环境变量（必填 MiniMax）
cp .env.example .env.production
nano .env.production
```

`.env.production` 最少：

```env
MINIMAX_API_KEY=你的key
MINIMAX_BASE_URL=https://api.minimaxi.com/v1
AI_MODEL=MiniMax-M3
AI_MAX_CONCURRENT=3
```

```bash
# 5) 首次构建并启动（3001，避开已有 3000 服务）
npm ci
npm run build
PORT=3001 pm2 start npm --name yifei-labs -- start
pm2 save
pm2 startup   # 按提示执行它输出的那行 sudo 命令
```

自检：

```bash
curl -I http://127.0.0.1:3001
pm2 status
```

### Nginx 反代（可选但推荐）

若已有 Nginx，增加站点（子域名示例）：

```nginx
server {
  listen 80;
  server_name career.你的域名.com;   # 或先用 _ 仅 IP 测试

  client_max_body_size 20m;

  location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 120s;
    proxy_send_timeout 120s;
  }
}
```

```bash
sudo nginx -t && sudo systemctl reload nginx
```

安全组：放行 **80/443**；不必把 3001 对公网开放。

---

## 二、配置 SSH 免密（给 GitHub Actions 用）

在**你自己电脑**或服务器上生成**专用部署密钥**（不要用登录密码）：

```bash
ssh-keygen -t ed25519 -C "github-actions-yifei" -f yifei_deploy_key -N ""
```

得到：

- `yifei_deploy_key` → **私钥**（放进 GitHub Secrets）
- `yifei_deploy_key.pub` → **公钥**

把公钥装到阿里云服务器：

```bash
# 在服务器上
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "这里粘贴 yifei_deploy_key.pub 的内容" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

本机测试（把 IP 换成你的）：

```bash
ssh -i yifei_deploy_key root@你的公网IP "echo ok"
```

> 若登录用户不是 `root`，用实际用户名（如 `ubuntu`），并保证该用户对 `/var/www/yifei-labs` 可写。

---

## 三、GitHub 仓库 Secrets

打开：  
https://github.com/yuanyifan686/yifei-labs/settings/secrets/actions  

点 **New repository secret**，逐个添加：

| Name | 示例值 | 说明 |
|------|--------|------|
| `ALIYUN_HOST` | `47.xx.xx.xx` | 公网 IP 或域名 |
| `ALIYUN_USER` | `root` 或 `ubuntu` | SSH 用户 |
| `ALIYUN_SSH_KEY` | 私钥全文 | `yifei_deploy_key` 文件全部内容（含 `BEGIN`/`END`） |
| `ALIYUN_SSH_PORT` | `22` | 若改过 SSH 端口则填实际端口 |
| `ALIYUN_APP_PATH` | `/var/www/yifei-labs` | 服务器上项目绝对路径 |
| `ALIYUN_APP_PORT` | `3001` | 与 pm2 一致 |
| `ALIYUN_PM2_NAME` | `yifei-labs` | pm2 进程名 |

**不要**把 `MINIMAX_API_KEY` 放进 GitHub（放在服务器 `.env.production` 即可）。

---

## 四、推送代码触发自动部署

仓库里已有工作流：`.github/workflows/deploy-aliyun.yml`

1. 把本仓库最新代码（含该 workflow）推到 GitHub  
2. 打开 Actions 页，应出现 **Deploy Aliyun**  
3. 也可点 **Run workflow** 手动部署  

成功日志末尾应有 `deploy ok`。

之后：

```text
本地改代码 → git push → 自动部署到阿里云
```

---

## 五、常见问题

### 1. Permission denied (publickey)

- Secrets 里私钥是否完整  
- 服务器 `authorized_keys` 是否含对应公钥  
- `ALIYUN_USER` 是否正确  

### 2. npm / node: command not found

服务器用 nvm 时，workflow 已尝试加载 `~/.nvm/nvm.sh`。  
也可把 Node 装到系统路径（nodesource）。

### 3. pm2 not found

```bash
sudo npm i -g pm2
```

### 4. 构建内存不够

轻量 1G 机器可能 OOM，可：

```bash
# 临时加 swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

或升到 2G 内存。

### 5. 部署成功但页面旧

- 浏览器强刷  
- `pm2 logs yifei-labs` 看是否起在 3001  
- Nginx 是否仍指向旧端口  

### 6. 和 3000 上旧服务冲突吗？

不冲突：不同端口、不同 pm2 名字、不同 Nginx `server_name` 即可。

---

## 六、可选：限制 SSH 来源

阿里云安全组可只允许必要 IP；GitHub Actions IP 会变，一般靠**专用密钥 + 禁止密码登录**更实际。

```bash
# /etc/ssh/sshd_config 建议
PasswordAuthentication no
PermitRootLogin prohibit-password
```

改完：`sudo systemctl reload sshd`

---

## 七、回滚

```bash
cd /var/www/yifei-labs
git log --oneline -5
git reset --hard <某次成功的 commit>
npm ci && npm run build
PORT=3001 pm2 restart yifei-labs
```

或在 GitHub 对旧 commit 点 **Re-run jobs**（若仍指向同一分支需先回退分支）。

---

## 检查清单

- [ ] 服务器 Node 20+、pm2、项目已 clone  
- [ ] `.env.production` 已填 MiniMax  
- [ ] `PORT=3001 pm2` 本地可访问  
- [ ] 部署公钥在 `authorized_keys`  
- [ ] GitHub 7 个 Secrets 已配  
- [ ] 推送后 Actions 绿勾  
- [ ] 公网/域名能打开新版本  
