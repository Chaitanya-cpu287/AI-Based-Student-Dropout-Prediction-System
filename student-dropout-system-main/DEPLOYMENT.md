# 🌐 Cloud Deployment & Hosting Guide
## AI-Based Student Dropout Prediction System (EduGuard)

This guide provides tested, step-by-step instructions to deploy EduGuard to production environments with **zero cost** or minimal setup.

---

## ⚡ Option 1: Free Cloud Hosting on Render (Recommended)

Render offers free tier hosting for Node.js and Python web services.

### Architecture on Render
1. **Service A (Python ML API)**: Flask REST service hosting the Voting Ensemble model.
2. **Service B (Node.js Backend & Frontend)**: Express server serving both the REST API and the frontend web portal.

### Deployment Steps:

#### Step 1: Deploy Python ML API on Render
1. Sign in to [Render](https://render.com/).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Configure settings:
   - **Name**: `eduguard-ml-api`
   - **Root Directory**: `student-dropout-system-main/ml_api` (or `ml_api`)
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app -b 0.0.0.0:$PORT`
   - **Instance Type**: `Free`
5. Click **Create Web Service**.
6. Once deployed, copy your ML API URL (e.g. `https://eduguard-ml-api.onrender.com`).

#### Step 2: Deploy Node.js Backend & Frontend on Render
1. Click **New +** -> **Web Service**.
2. Connect the same repository.
3. Configure settings:
   - **Name**: `eduguard-app`
   - **Root Directory**: `student-dropout-system-main/backend` (or `backend`)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
4. Under **Environment Variables**, add:
   - `ML_API_URL`: `https://eduguard-ml-api.onrender.com` (from Step 1)
   - `GEMINI_API_KEY`: *(Your Google AI Studio Gemini API Key)*
   - `GEMINI_MODEL`: `gemini-1.5-flash`
   - *(Optional)* If you create a free PostgreSQL instance on Render, add `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME`. If omitted, EduGuard **automatically uses persistent local database storage**.
5. Click **Create Web Service**.
6. Open your live application URL (e.g. `https://eduguard-app.onrender.com`). You will see the complete portal live on the web!

---

## 🐳 Option 2: Docker Compose (Any VPS / DigitalOcean / AWS EC2)

You can launch the entire stack (PostgreSQL + Python ML API + Node.js Backend & Web UI) with a single command.

### Prerequisites:
- Docker and Docker Compose installed.

### Commands:
```bash
# 1. Clone repository
git clone https://github.com/your-username/student-dropout-system.git
cd student-dropout-system

# 2. (Optional) Configure environment variables in .env
echo "GEMINI_API_KEY=your_key_here" > .env

# 3. Launch the full stack
docker compose up -d --build

# 4. View running services
docker compose ps
```

* Ports opened:
  - Frontend & Backend: `http://localhost:3000` (or your VPS Public IP `http://<YOUR_IP>:3000`)
  - ML API: `http://localhost:5000`
  - PostgreSQL: `localhost:5432`

---

## 🚂 Option 3: Railway.app Deployment

1. Sign in to [Railway](https://railway.app/).
2. Click **New Project** -> **Deploy from GitHub repo**.
3. Select this repository.
4. Railway will automatically detect the `docker-compose.yml` or allow you to deploy services individually with zero configuration.
5. Add the `GEMINI_API_KEY` in Railway dashboard variables.
6. Generate a public domain in Railway settings and your site is live!

---

## 🔒 Production Security Checklist

| Check | Status | Details |
| :--- | :--- | :--- |
| **CORS Policies** | ✅ Configured | Dynamic origin support for production and development |
| **API Port Independence** | ✅ Dynamic | Dynamically reads `PORT` from environment variables |
| **Single-Port Fullstack Serving** | ✅ Enabled | Express hosts the static frontend directly from `/` |
| **Database Resiliency** | ✅ Dual Engine | Automatically switches to local storage if PostgreSQL connection drops |
| **Model Verification** | ✅ Calibrated | Soft voting ensemble with StandardScaler pipeline and Brier loss 0.111 |
