# GitHub + site online

## 1. Push to GitHub

1. Go to **https://github.com/new**
2. Create a new repository (e.g. `escape-tsunami-wfl`), **without** README (you already have a commit).
3. In the project folder in terminal:

```powershell
cd c:\Users\subde\strona
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
git branch -M main
git push -u origin main
```

(Replace `YOUR_USERNAME` and `REPO_NAME` with your details.)

---

## 2. Site online (Vercel – free)

The site works **without the backend** (data from `brainrots.json`), so deploying the frontend is enough.

1. Go to **https://vercel.com** and sign in (e.g. via GitHub).
2. **Add New… → Project**.
3. **Import** your repository from GitHub.
4. Set:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Click **Deploy**.

After a moment you’ll get a link like `your-project.vercel.app` – that’s your site.

---

### Optional: backend online

If you later want the API (image proxy, always fresh data from backend):

- **Vercel:** add an `api/` directory at the root with serverless functions (you’d need to adapt Express to functions).
- **Railway / Render:** deploy the `backend` folder and run `node server.js`, then set the API URL in the frontend (Vite) config.

To start, the frontend on Vercel is enough – the WFL calculator and list work fully.
