# 💰 Plutoa - Personal Finance Manager

> Moderní webová aplikace pro komplexní správu osobních financí s AI-powered insights a pokročilými vizualizacemi.

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Django](https://img.shields.io/badge/django-5.2.8-green.svg)
![React](https://img.shields.io/badge/react-19.1.1-blue.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.x-blue.svg)
![PWA](https://img.shields.io/badge/PWA-enabled-purple.svg)

---

## 📋 Popis Projektu

Plutoa je moderní **Progressive Web Application** pro správu osobních financí. Aplikace kombinuje intuitivní uživatelské rozhraní s pokročilými analytickými nástroji a AI-powered insights pro kompletní kontrolu nad vašimi financemi.

### 🎯 Co Plutoa umí?

✅ Sledování příjmů a výdajů s kategorizací  
✅ Vytváření a monitoring rozpočtů  
✅ Pokročilé vizualizace (Heatmap, Waterfall, Pie Charts)  
✅ AI-powered finanční doporučení  
✅ Real-time budget alerts  
✅ CSV Import/Export transakcí  
✅ Dark/Light mode  
✅ Offline funkčnost (PWA)  
✅ Instalovatelná jako nativní aplikace  

---

## ✨ Klíčové Funkce v2.0

### 📊 Advanced Analytics
- **Heatmap Calendar** - Vizualizace denní aktivity za 3 měsíce
- **Waterfall Chart** - Kaskádový graf cash flow
- **Category Distribution** - Interaktivní pie charty pro příjmy/výdaje
- **Trend Analysis** - Automatická detekce trendů
- **Financial Health Score** - Celkové hodnocení finančního zdraví (0-100)

### 🤖 AI-Powered Insights
- Automatická detekce neobvyklých výdajů
- Personalizovaná doporučení na úspory
- Upozornění na překročení rozpočtu
- Analýza spending patterns
- Expandable insight cards s detaily

### 🔔 Smart Budget Alerts
- Real-time monitoring rozpočtů
- Automatické alerty při 80%, 90%, 100% využití
- Toast notifications
- Color-coded severity indikátory

### 📱 Progressive Web App
- Instalovatelná jako nativní aplikace
- Offline podpora s service worker
- Cache-first strategie pro rychlé načítání
- Network-first pro API data

### 🌓 Dark/Light Mode
- Plně funkční theme switching
- localStorage persistence
- Smooth transitions
- Optimalizované barevné palety

### 📥 Data Management
- CSV Import s drag & drop UI
- CSV Export pro zálohu dat
- Bulk import stovek transakcí
- Automatická validace dat

### 🔐 Bezpečnost
- JWT token autentizace
- Password reset s email verifikací
- CSRF protection
- Secure token generation

---

## 🛠 Technologie

### Frontend
- **React** 19.1.1 (TypeScript)
- **React Router** v6
- **Axios** 1.12.2
- **Recharts** 3.4.1 (vizualizace)
- **PWA** s Service Worker
- Vlastní CSS (glassmorphism + prism effects)

### Backend
- **Django** 5.2.8
- **Django REST Framework** 3.16.1
- **djangorestframework-simplejwt** 5.5.1
- **SQLite** (development) / **PostgreSQL** (production ready)

---

## 📦 Požadavky

Před spuštěním aplikace se ujistěte, že máte nainstalováno:

- **Python** 3.10 nebo vyšší
- **Node.js** 18.x nebo vyšší
- **npm** nebo **yarn**
- **pip** (Python package manager)

---

## 🚀 Instalace a Spuštění

### 1️⃣ Stažení projektu

```bash
git clone https://github.com/TomasHoles/Zaverecny-projekt.git
cd Zaverecny-projekt
```

### 2️⃣ Backend Setup (Django)

#### Krok 1: Vytvoření virtuálního prostředí

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

#### Krok 2: Instalace závislostí

```bash
pip install -r requirements.txt
```

#### Krok 3: Migrace databáze

```bash
python manage.py migrate
```

#### Krok 4: Vytvoření superusera (admin)

```bash
python manage.py createsuperuser
```

#### Krok 5: Spuštění Django serveru

```bash
python manage.py runserver
```

✅ Backend nyní běží na: **http://localhost:8000**
✅ Admin panel: **http://localhost:8000/admin**

---

### 3️⃣ Frontend Setup (React)

Otevřete **nový terminál** (nechte backend běžet) a přejděte do složky frontend:

#### Krok 1: Přejděte do složky frontend

```bash
cd frontend
```

#### Krok 2: Instalace závislostí

```bash
npm install
```

#### Krok 3: Spuštění React aplikace (Development)

```bash
npm start
```

✅ Frontend nyní běží na: **http://localhost:3000**
✅ Aplikace se automaticky otevře v prohlížeči

#### (Volitelné) Production Build

```bash
npm run build
```

Build se vytvoří ve složce `build/` a lze jej servírovat přes:
```bash
npx serve -s build
```

---

## 📱 PWA Instalace

1. Otevřete aplikaci v Chrome/Edge
2. Počkejte 30 sekund - objeví se install prompt
3. Klikněte "Install" nebo použijte menu → "Install Plutoa"
4. Aplikace se nainstaluje jako nativní aplikace

---

## 🧪 Testování

Podrobný testing checklist najdete v souboru **`TESTING_CHECKLIST.md`**

### Quick Test

```bash
# Backend check
python manage.py check

# Run backend tests
python manage.py test

# Frontend check (lint)
cd frontend
npm run lint
```

---

## 📚 Dokumentace

- **`TESTING_CHECKLIST.md`** - Kompletní testing guide
- **`RELEASE_NOTES.md`** - Release notes pro v2.0
- **`CHANGELOG.md`** - Detailní changelog
- **`SECURITY.md`** - Security best practices

---

## 🎨 Screenshoty

### Dashboard
![Dashboard](docs/screenshots/dashboard.png)

### Analytics
![Analytics](docs/screenshots/analytics.png)

### Dark Mode
![Dark Mode](docs/screenshots/dark-mode.png)

---

## 🔧 Konfigurace

### Environment Variables

Vytvořte `.env` soubor v root adresáři:

```env
# Django
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (pro PostgreSQL)
DB_ENGINE=django.db.backends.postgresql
DB_NAME=plutoa
DB_USER=postgres
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432

# Email (pro password reset)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

---

## 🤝 Přispívání

Příspěvky jsou vítány! Postupujte podle těchto kroků:

1. Fork projektu
2. Vytvořte feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit změny (`git commit -m 'Add some AmazingFeature'`)
4. Push do branch (`git push origin feature/AmazingFeature`)
5. Otevřete Pull Request

---

## 📄 Licence

Tento projekt je licencován pod MIT licencí - viz soubor `LICENSE` pro detaily.

---

## 👨‍💻 Autor

**Tomáš Holes**
- GitHub: [@TomasHoles](https://github.com/TomasHoles)
- Email: tomas.holes@example.com

---

## 🙏 Poděkování

- Django & DRF community
- React community
- Recharts za skvělé vizualizace
- Všem, kteří přispěli k tomuto projektu

---

## 📈 Roadmap (v2.1)

- [ ] Multi-currency support
- [ ] Recurring transactions automation
- [ ] Bank account synchronization
- [ ] Mobile app (React Native)
- [ ] Investment tracking
- [ ] Tax calculation tools
- [ ] Family/shared budgets
- [ ] Advanced PDF reporting

---

**⭐ Pokud se vám projekt líbí, dejte mu hvězdičku na GitHubu!**

---

Made with ❤️ in Czech Republic


