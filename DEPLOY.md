# Wdrożenie krok po kroku (etbvalues.com)

Założenia: masz projekt w folderze `strona`, domenę **etbvalues.com** w Namecheap, konto na **GitHub**, **Vercel**, **Railway** (wszystkie mają darmowe plany na start).

---

## Część A — Kod na GitHubie

### A1. Utwórz repozytorium na GitHub

1. Wejdź na [github.com](https://github.com) → zaloguj się.
2. **+** (prawy górny róg) → **New repository**.
3. **Repository name:** np. `etbvalues` (dowolna nazwa).
4. **Private** lub **Public** — jak wolisz.
5. **Create repository** (bez README, jeśli już masz kod lokalnie).

### A2. Wyślij kod z komputera (PowerShell w folderze projektu)

W Cursorze/terminalu, w katalogu projektu (np. `c:\Users\subde\strona`):

```powershell
git status
```

Jeśli nie ma jeszcze gita:

```powershell
git init
git add .
git commit -m "Initial commit"
```

Podłącz **swój** adres repo (podmień `TWOJ_LOGIN` i `NAZWA_REPO`):

```powershell
git remote add origin https://github.com/TWOJ_LOGIN/NAZWA_REPO.git
git branch -M main
git push -u origin main
```

Przy pierwszym pushu GitHub może poprosić o logowanie (przeglądarka lub token). Po udanym pushu na stronie repo zobaczysz pliki.

---

## Część B — Backend na Railway (API)

### B1. Konto i projekt

1. Wejdź na [railway.app](https://railway.app) → **Login** (najwygodniej **Login with GitHub**).
2. **New Project** → **Deploy from GitHub repo**.
3. Jeśli pierwszy raz: **Configure GitHub App** → zezwól Railway na dostęp do repozytoriów (wybierz to repo lub „All repositories”).
4. Wybierz **swoje** repo z listy.

### B2. Ustaw folder `backend`

1. Railway utworzy usługę — kliknij w nią.
2. Zakładka **Settings** (lub **⚙**).
3. Znajdź **Root Directory** / **Working Directory** → wpisz: `backend` → **Save**.

### B3. Zmienne środowiskowe

1. W projekcie Railway: **Variables** (lub **Variables** przy serwisie).
2. **Add variable** — wklej to, co masz lokalnie w `backend/.env`, np.:
   - `OPENAI_API_KEY` = `sk-...` (jeśli używasz czatu w aplikacji).
3. Nie musisz ustawiać `PORT` — Railway nadaje port automatycznie.

### B4. Deploy i kopiowanie URL

1. Railway sam zbuduje i uruchomi (`npm start` z `backend/package.json`).
2. Zakładka **Settings** → **Networking** / **Generate Domain** (albo przy deployu widzisz **Public URL**).
3. Skopiuj adres w stylu: `https://cos-tam.up.railway.app`  
   **Bez** ukośnika na końcu.  
   **Zapisz go w notatniku** — potrzebny do Vercela.

### B5. Test API (opcjonalnie)

W przeglądarce otwórz:

`https://TWOJ-URL-Z-RAILWAY.app/api/items`

Powinien być JSON z listą — wtedy backend działa.

---

## Część C — Frontend na Vercel

### C1. Import projektu

1. Wejdź na [vercel.com](https://vercel.com) → **Log in** (np. **Continue with GitHub**).
2. **Add New…** → **Project**.
3. **Import** swoje repozytorium z GitHuba (jeśli nie widać — **Adjust GitHub App** i nadaj Vercelowi dostęp do repo).

### C2. Ustawienia buildu

1. **Framework Preset:** wybierz **Vite** (albo zostaw wykryte).
2. **Root Directory:**  
   - **Zostaw puste** albo wpisz `.` — wtedy użyty zostanie **`vercel.json` z głównego folderu repo** (build robi `cd frontend && npm install && npm run build`).
   - Jeśli Vercel każe wybrać folder: nie wybieraj tylko `frontend` w tym kroku, dopóki nie przeczytasz uwagi w `DEPLOY.md` o root — **najprościej: root = całe repo** jak wyżej.
3. **Environment Variables** → **Add**:
   - **Name:** `VITE_API_URL`
   - **Value:** wklej **dokładnie** URL z Railway, np. `https://cos-tam.up.railway.app` (bez `/` na końcu).

### C3. Deploy

1. Kliknij **Deploy**.
2. Po kilku minutach dostaniesz link `https://twoj-projekt.vercel.app` — otwórz go. Strona powinna ładować dane z API.

### C4. Gdy coś nie działa

- **Pusta strona / błędy API:** sprawdź, czy `VITE_API_URL` jest ustawione **przed** buildem. Po zmianie zmiennej: **Deployments** → przy ostatnim deployu **⋯** → **Redeploy**.
- **CORS:** w `backend/server.js` są już `etbvalues.com` — na czas testów na `*.vercel.app` CORS i tak często przepuszcza (sprawdź w konsoli przeglądarki F12).

---

## Część D — Domena etbvalues.com → Vercel + Namecheap

Zrób to **dopiero gdy** `https://….vercel.app` działa poprawnie.

### D1. Dodaj domenę w Vercel

1. Vercel → **twój projekt** → **Settings** → **Domains**.
2. **Add** → wpisz `etbvalues.com` → **Add**.
3. Dodaj też `www.etbvalues.com` (Vercel często sam zaproponuje przekierowanie `www` → apex lub odwrotnie).

### D2. Zobacz, jakie DNS wpisać

Vercel przy każdej domenie pokaże **konkretne rekordy** (czasem inne niż „klasyczne” — **zawsze kopiuj z Vercela**).

Typowo wygląda to tak:

| Typ   | Host | Wartość              |
|-------|------|----------------------|
| **A** | `@`  | `76.76.21.21`        |
| **CNAME** | `www` | `cname.vercel-dns.com` |

**Uwaga:** Vercel może podać inny CNAME — użyj **tego z panelu**.

### D3. Namecheap — Advanced DNS

1. [namecheap.com](https://www.namecheap.com) → **Domain List** → **Manage** przy **etbvalues.com**.
2. Zakładka **Advanced DNS**.
3. **Usuń** (trash) stare rekordy, które kolidują:
   - parking / `parkingpage` dla `@` lub `www`,
   - zduplikowane **A** lub **CNAME** dla `www` / `@`.
4. **Add New Record** — dodaj rekordy **tak jak w Vercelu** (typ, host, value).
   - Dla **CNAME** wartość często kończy się kropką: `cname.vercel-dns.com.` — na Namecheap zwykle możesz wpisać z kropką lub bez (zgodnie z podpowiedzią Namecheap).
5. Zapisz.

### D4. Czekaj

- Status domeny w Vercelu zmieni się na **Valid** (czasem **Invalid** przez kilka minut — to normalne).
- Propagacja DNS: od kilku minut do 24–48 h.

---

## Część E — GitHub Actions (zielony build)

Nic nie musisz włączać ręcznie — jeśli w repo jest folder `.github/workflows/`, GitHub to sam uruchamia.

### E1. Gdzie to zobaczyć

1. Na GitHubie otwórz **swoje repo**.
2. Zakładka **Actions**.
3. Po każdym **pushu** na branch `main` (lub `master`) pojawi się workflow **„Frontend build”**.
4. Kliknij w ostatnie uruchomienie — **zielony ptaszek** = build frontu przeszedł; **czerwony** = kliknij job → zobacz log błędu (np. błąd `npm run build`).

### E2. Jeśli nie ma Actions

- Upewnij się, że **wypchnąłeś** folder `.github` na GitHub (`git add`, `commit`, `push`).
- W repo **Settings** → **Actions** → **General**: **Allow all actions** (domyślnie włączone).

---

## Szybka checklista

| # | Co | Gdzie |
|---|----|--------|
| 1 | Kod na GitHubie | `git push` |
| 2 | Backend URL | Railway → publiczny URL |
| 3 | `VITE_API_URL` | Vercel → Environment Variables |
| 4 | Deploy frontu | Vercel → Deploy |
| 5 | Domena | Vercel → Domains + Namecheap → DNS |
| 6 | CI | GitHub → Actions |

---

## Pliki w repo (przypomnienie)

- `vercel.json` — build frontu z podfolderu `frontend/`.
- `frontend/.env.example` — przykład `VITE_API_URL` (na Vercelu ustawiasz w panelu, nie commituj sekretów w pliku `.env`).

Lokalnie nadal: `npm run dev:all` — bez `VITE_API_URL` działa proxy z `vite.config.js`.
