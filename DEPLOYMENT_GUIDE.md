# Deployment Guide for UniGrievance System

This guide outlines the steps to deploy your application to **Render (Backend)** and **Vercel (Frontend)**.

## 1. Backend Deployment (Render)

We will use Render for the Python/Flask backend because it supports persistent web services easily.

### Steps:
1.  Push your code to GitHub.
2.  Log in to [dashboard.render.com](https://dashboard.render.com/).
3.  Click **New +** -> **Web Service**.
4.  Connect your GitHub repository.
5.  **Settings:**
    *   **Name:** `unigrievance-backend` (or similar)
    *   **Root Directory:** `backend` (Important: Point to the backend folder)
    *   **Environment:** Python 3
    *   **Build Command:** `pip install -r requirements.txt`
    *   **Start Command:** `gunicorn server:app`
6.  **Environment Variables (Advanced Section):**
    *   Add `SECRET_KEY` = (A random secret string)
    *   Add `MAIL_USERNAME` = (Your Gmail)
    *   Add `MAIL_PASSWORD` = (Your App Password)
    *   Add `MAIL_DEFAULT_SENDER` = (Your Email)
    *   Add `ALLOWED_UNIVERSITY_DOMAINS` = `kluniversity.in,gmail.com`
7.  Click **Create Web Service**.
8.  **Wait for deployment.** Once live, copy the URL (e.g., `https://unigrievance-backend.onrender.com`).

---

## 2. Frontend Deployment (Vercel)

We use Vercel for the React frontend.

### Steps:
1.  Log in to [vercel.com](https://vercel.com/).
2.  Click **Add New...** -> **Project**.
3.  Import your GitHub repository.
4.  **Configure Project:**
    *   **Framework Preset:** Vite (should be auto-detected)
    *   **Root Directory:** `./` (default)
    *   **Build Command:** `npm run build` (default)
    *   **Output Directory:** `dist` (default)
5.  **Environment Variables:**
    *   Add `VITE_API_URL` = (The Render Backend URL from Step 1, e.g., `https://unigrievance-backend.onrender.com`)
    *   *Note: Do NOT include a trailing slash.*
6.  Click **Deploy**.

---

## 3. Post-Deployment Verification
1.  Open your Vercel URL.
2.  Try to **Register/Login**. If it fails, check the Network tab in Developer Tools to ensure requests are going to `onrender.com` and not `localhost`.
3.  **Admin Login:**
    *   User: `admin`
    *   Pass: `admin123`
