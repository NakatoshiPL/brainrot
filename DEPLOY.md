# GitHub + strona online

## 1. Wypchnięcie na GitHub

1. Wejdź na **https://github.com/new**
2. Utwórz nowe repozytorium (np. `escape-tsunami-wfl`), **bez** README (masz już commit).
3. W terminalu w folderze projektu:

```powershell
cd c:\Users\subde\strona
git remote add origin https://github.com/TWOJ_LOGIN/NAZWA_REPO.git
git branch -M main
git push -u origin main
```

(Zamień `TWOJ_LOGIN` i `NAZWA_REPO` na swoje dane.)

---

## 2. Strona online (Vercel – za darmo)

Strona działa **bez backendu** (dane z pliku `brainrots.json`), więc wystarczy wrzucić frontend.

1. Wejdź na **https://vercel.com** i zaloguj się (np. przez GitHub).
2. **Add New… → Project**.
3. **Import** swojego repozytorium z GitHub.
4. Ustaw:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Kliknij **Deploy**.

Po chwili dostaniesz link typu `twoj-projekt.vercel.app` – to Twoja strona online.

---

### Opcjonalnie: backend online

Jeśli kiedyś chcesz mieć też API (obrazki przez proxy, zawsze świeże dane z backendu):

- **Vercel:** dodaj w katalogu głównym `api/` ze serverless functions (trzeba przepisać Express na funkcje).
- **Railway / Render:** wrzuć tam folder `backend` i uruchom `node server.js`, a w ustawieniach frontu (Vite) ustaw zmienną z adresem API.

Na start wystarczy sam frontend na Vercelu – kalkulator WFL i lista działają w pełni.
