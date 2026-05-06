# Customer Survey System - Railway Deployment

## 快速部署到 Railway

### 方法 1：使用 GitHub（推荐）

1. **创建 GitHub 仓库**
   ```bash
   cd /root/.openclaw/workspace/survey
   # 将文件上传到您的 GitHub 仓库
   ```

2. **连接 Railway**
   - 访问 https://railway.app/
   - 登录 → New Project → Deploy from GitHub
   - 选择您的仓库

3. **配置环境变量**
   在 Railway 项目设置中添加：
   ```
   FEISHU_APP_ID=cli_a92015a117b99cc2
   FEISHU_APP_SECRET=OobuZX3Tjq6k5Op2CyFWTgowJekCMPJj
   PORT=3000
   ```

4. **部署完成**
   Railway 会自动部署，生成公网 URL（如：`https://xxx-production.up.railway.app`）

### 方法 2：使用 Railway CLI

```bash
# 安装 Railway CLI
npm install -g @railway/cli

# 登录 Railway
railway login

# 初始化项目
railway init

# 添加环境变量
railway variables set FEISHU_APP_ID=cli_a92015a117b99cc2
railway variables set FEISHU_APP_SECRET=OobuZX3Tjq6k5Op2CyFWTgowJekCMPJj
railway variables set PORT=3000

# 部署
railway up
```

## 获取公网 URL

部署完成后，Railway 会生成公网 URL：
- 格式：`https://xxx-production.up.railway.app`
- 在 Railway 项目页面 → Settings → Domains 查看

## 更新 Shopify HTML

拿到 Railway URL 后，更新 `shopify-survey.html`：

```javascript
const SUBMIT_ENDPOINT = 'https://xxx-production.up.railway.app/api/submit';
```

## 免费额度

- Railway 提供 $5/月 免费额度
- 本项目预计使用：$2-3/月
- 无需信用卡即可开始

## 文件结构

```
survey/
├── public/
│   └── index.html      # 前端表单
├── server.js           # 后端服务
├── package.json        # 依赖配置
├── railway.json        # Railway 配置
├── .nvmrc              # Node.js 版本
└── README.md
```
