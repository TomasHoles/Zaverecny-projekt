# Plutoa - Personal Finance Manager

Moderní webová aplikace pro komplexní správu osobních financí s pokročilými analytickými nástroji a vizualizacemi.

---

## Popis projektu

Plutoa je Progressive Web Application pro správu osobních financí. Aplikace kombinuje intuitivní uživatelské rozhraní s pokročilými analytickými nástroji pro kompletní kontrolu nad financemi uživatele.

### Hlavní funkce

- Sledování příjmů a výdajů s kategorizací
- Vytváření a monitoring rozpočtů
- Definování finančních cílů s vizualizací pokroku
- Pokročilé vizualizace (Heatmap Calendar, Waterfall Chart, Pie Charts)
- Upozornění na překročení rozpočtu v reálném čase
- CSV Import a Export transakcí
- Opakující se transakce s automatickým vytvářením

---

## Klíčové funkce

### Pokročilá analytika

- **Heatmap Calendar** - vizualizace denní aktivity za 3 měsíce
- **Waterfall Chart** - kaskádový graf cash flow
- **Category Distribution** - interaktivní koláčové grafy pro příjmy a výdaje
- **Trend Analysis** - automatická detekce trendů v kategoríích
- **Financial Health Score** - celkové hodnocení finančního zdraví (0-100)

### Finanční přehledy

- Automatická detekce neobvyklých výdajů
- Personalizovaná doporučení na úspory
- Upozornění na překročení rozpočtu
- Analýza vzorců utrácení
- Rozšiřitelné karty s detailními informacemi

### Inteligentní upozornění na rozpočty

- Monitoring rozpočtů v reálném čase
- Automatické upozornění při 80%, 90% a 100% využití
- Toast notifikace
- Barevné indikátory závažnosti (zelená, oranžová, červená)

### Správa dat

- CSV Import s drag and drop rozhraním
- CSV Export pro zálohu dat
- Hromadný import transakcí
- Automatická validace vstupních dat

### Bezpečnost

- JWT token autentizace s automatickou rotací
- Reset hesla pomocí tokenů
- CSRF ochrana
- Rate limiting pro API
- Bezpečné generování tokenů

---

## Použité technologie

### Frontend

| Technologie | Verze | Účel |
|-------------|-------|------|
| React | 19.1.1 | Uživatelské rozhraní |
| TypeScript | 4.9.5 | Statické typování |
| React Router | 7.9.6 | Směrování |
| Axios | 1.13.2 | HTTP komunikace |
| Recharts | 3.4.1 | Vizualizace dat |
| Lucide React | 0.554.0 | Ikony |
| GSAP | 3.13.0 | Animace |

### Backend

| Technologie | Verze | Účel |
|-------------|-------|------|
| Django | 5.2.8 | Webový framework |
| Django REST Framework | 3.16.1 | REST API |
| SimpleJWT | 5.5.1 | JWT autentizace |
| SQLite | - | Databáze (development) |
| PostgreSQL | - | Databáze (production) |

---

## Systémové požadavky

- Python 3.10 nebo vyšší
- Node.js 18.x nebo vyšší
- npm nebo yarn
- pip

---

## Instalace a spuštění

### 1. Stažení projektu

```bash
git clone https://github.com/TomasHoles/Zaverecny-projekt.git
cd Zaverecny-projekt
```

### 2. Konfigurace backendu (Django)

#### Vytvoření virtuálního prostředí

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**Linux/macOS:**
```bash
python3 -m venv venv
source venv/bin/activate
```

#### Instalace závislostí

```bash
pip install -r requirements.txt
```

#### Spuštění databázových migrací

```bash
python manage.py migrate
```

#### Spuštění serveru

```bash
python manage.py runserver
```

Backend nyní běží na: `http://localhost:8000`

### 3. Konfigurace frontendu (React)

V novém terminálu (backend nechte běžet):

```bash
cd frontend
npm install
npm start
```

Frontend nyní běží na: `http://localhost:3000`

---

## Struktura projektu

```
Zaverecny-projekt/
├── accounts/           # Správa uživatelů a autentizace
├── analytics/          # Analytické funkce a statistiky
├── budgets/            # Správa rozpočtů
├── finance_platform/   # Hlavní Django konfigurace
├── frontend/           # React aplikace
│   ├── src/
│   │   ├── components/ # React komponenty
│   │   ├── contexts/   # React Context (Auth, Toast, Theme)
│   │   ├── services/   # API služby
│   │   └── styles/     # CSS styly
│   └── package.json
├── goals/              # Finanční cíle
├── notifications/      # Systém notifikací
├── transactions/       # Transakce a kategorie
├── latex/              # Dokumentace v LaTeX
├── manage.py           # Django management script
├── requirements.txt    # Python závislosti
└── db.sqlite3          # SQLite databáze
```

---

## API Endpointy

| Endpoint | Metoda | Popis |
|----------|--------|-------|
| `/api/accounts/login/` | POST | Přihlášení uživatele |
| `/api/accounts/register/` | POST | Registrace uživatele |
| `/api/accounts/users/me/` | GET | Profil přihlášeného uživatele |
| `/api/transactions/` | GET, POST | Seznam a vytváření transakcí |
| `/api/categories/` | GET, POST | Seznam a vytváření kategorií |
| `/api/budgets/` | GET, POST | Seznam a vytváření rozpočtů |
| `/api/goals/` | GET, POST | Seznam a vytváření cílů |
| `/api/analytics/overview/` | GET | Analytický přehled |
| `/api/analytics/health-score/` | GET | Financial Health Score |
| `/api/notifications/` | GET | Seznam notifikací |

---

## Databázové schéma

Aplikace používá následující hlavní entity:

- **User** - uživatelé systému s preferencemi měny
- **Category** - kategorie transakcí (příjmy, výdaje)
- **Transaction** - finanční transakce
- **Budget** - rozpočty s přiřazenými kategoriemi
- **FinancialGoal** - finanční cíle s příspěvky
- **RecurringTransaction** - opakující se transakce
- **Notification** - systémové notifikace

---

## Autor

**Tomáš Holes**

Střední škola průmyslová a umělecká, Opava  
Obor: Informační technologie  
Školní rok: 2024/25

---

## Poznámky pro programátory

### Architektura aplikace

Aplikace využívá architekturu **client-server** s odděleným frontendem a backendem:

- **Frontend**: Single Page Application (SPA) v Reactu s TypeScriptem
- **Backend**: REST API v Django s Django REST Framework
- **Komunikace**: HTTP/JSON přes Axios s Token autentizací

### Klíčové soubory

| Soubor | Popis |
|--------|-------|
| `frontend/src/App.tsx` | Hlavní komponenta s routingem |
| `frontend/src/contexts/AuthContext.tsx` | Správa autentizace |
| `frontend/src/services/api.ts` | Axios konfigurace |
| `finance_platform/settings.py` | Django nastavení |
| `accounts/models.py` | User model a FinancialAccount |
| `transactions/models.py` | Transaction a Category modely |

### Konvence kódu

- **TypeScript**: Striktní typování, interface pro všechny props
- **Python**: PEP 8, docstrings pro všechny modely a views
- **CSS**: BEM naming, CSS proměnné pro barvy
- **Komentáře**: JSDoc style pro TypeScript, docstrings pro Python

### Spuštění v development módu

```bash
# Terminal 1 - Backend
python manage.py runserver

# Terminal 2 - Frontend
cd frontend && npm start
```

### Generování demo dat

```bash
# V Django admin nebo pomocí API
POST /api/transactions/generate-demo-data/
```

### Důležité závislosti

- **OGL**: WebGL knihovna pro Prism animaci na landing page
- **Recharts**: Všechny grafy v aplikaci
- **Lucide React**: Konzistentní ikony v celé aplikaci

---

## Licence

Tento projekt byl vytvořen jako závěrečná studijní práce.
