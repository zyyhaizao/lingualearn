# 🚀 LinguaLearn 部署指南

## 🔒 重要！安全第一！

**绝对不要**把以下文件提交到 GitHub：
- ❌ `.env`（包含数据库密码）
- ❌ 任何包含密钥的文件

✅ 只提交 `.env.example`（模板文件）

---

## 📋 第一步：上传代码到 GitHub

### 1. 在 GitHub 创建仓库
- 访问 https://github.com
- 登录账号（zyy1808666464）
- 点击右上角 "+" → "New repository"
- 仓库名称：`lingualearn`
- 选择 Public（公开）
- 点击 "Create repository"

### 2. 初始化 Git 并上传代码
在项目文件夹 `d:\Qproject\vue-project` 打开终端，运行：

```bash
cd d:\Qproject\vue-project
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/zyy1808666464/lingualearn.git
git push -u origin main
```

---

## 🗄️ 第二步：创建数据库（两种方案选一个）

### 方案 A：使用 Render 免费 PostgreSQL（推荐！）

1. 在 Render 点击 "+" → "New PostgreSQL"
2. 配置：
   - **Name**: `lingualearn-db`
   - **Plan**: Free
   - **Database Name**: `lingualearn`
   - **User**: `lingualearn`
3. 点击 "Create Database"
4. 等待创建完成，复制以下信息：
   - **Host**（例如：`dpg-xxx.oregon-postgres.render.com`）
   - **Port**（通常是 `5432`）
   - **Database**
   - **Username**
   - **Password**
   - **External Database URL**

### 方案 B：继续使用现有的 PostgreSQL

使用您已有的数据库：`175.31.253.10:5323`

---

## 🚀 第三步：在 Render 部署后端

### 1. 创建 Web Service
- 在 Render 点击 "+" → "New Web Service"
- 选择您的 `lingualearn` 仓库

### 2. 配置后端服务
填写以下信息：

| 配置项 | 值 |
|--------|-----|
| **Name** | `lingualearn-backend` |
| **Runtime** | Node |
| **Branch** | `main` |
| **Root Directory** | `（留空）` |
| **Build Command** | `npm install` |
| **Start Command** | `npm run server` |
| **Plan** | 选择 Free |

### 3. 添加环境变量（重要！）
点击 "Add Environment Variables"，**手动添加**以下变量（不要复制密码到 GitHub！）：

```
NODE_ENV=production
PORT=3001
DB_HOST=（您的数据库 Host）
DB_PORT=（您的数据库 Port，默认 5432）
DB_NAME=（您的数据库名称）
DB_USER=（您的数据库用户名）
DB_PASSWORD=（您的数据库密码）
JWT_SECRET=（点击 Generate，自动生成）
```

### 4. 部署
- 点击 "Create Web Service"
- 等待部署完成（约 2-3 分钟）
- **复制后端地址**（例如：`https://lingualearn-backend.onrender.com`）

---

## 🌐 第四步：在 Render 部署前端

### 1. 创建静态站点
- 在 Render 点击 "+" → "New Static Site"
- 选择同一个 `lingualearn` 仓库

### 2. 配置前端
填写以下信息：

| 配置项 | 值 |
|--------|-----|
| **Name** | `lingualearn` |
| **Branch** | `main` |
| **Root Directory** | `（留空）` |
| **Build Command** | `npm run build` |
| **Publish directory** | `dist` |

### 3. 配置重定向（重要！）
在 "Redirects/Rewrites" 部分添加：

| Source | Destination | Action |
|--------|-------------|--------|
| `/api/*` | `https://您的后端地址.onrender.com/api/:splat` | Rewrite |
| `/*` | `/index.html` | Rewrite |

### 4. 部署
- 点击 "Create Static Site"
- 等待部署完成
- **您的网站地址**（例如：`https://lingualearn.onrender.com`）

---

## ✅ 完成！

现在您可以分享您的网站链接给别人看啦！🎉

---

## 📝 常见问题

**Q: 部署后登录不了？**
A: 检查前端配置的后端地址是否正确，环境变量是否配置正确

**Q: 网站加载慢？**
A: Render 免费版首次加载可能较慢，之后就快了

**Q: 数据库连接失败？**
A: 确认环境变量中的数据库配置是否正确

**Q: 密码安全吗？**
A: 环境变量在 Render 后台是加密的，只有您能看到！