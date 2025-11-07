# Plutoa - Osobní finanční plánovač

![Plutoa Logo](https://via.placeholder.com/150x50/FF4742/FFFFFF?text=Plutoa)

## Popis Projektu

Plutoa je moderní webová aplikace pro správu osobních financí. Aplikace umožňuje uživatelům sledovat příjmy a výdaje, vytvářet rozpočty, analyzovat finanční návyky a mít své finance plně pod kontrolou.

## Klíčové Funkce

- **Správa Transakcí** - Přidávání, úprava a mazání příjmů a výdajů
- **Přehledy a Statistiky** - Detailní přehled financí s grafy
- **Správa Rozpočtů** - Nastavení měsíčních limitů a jejich sledování
- **Uživatelský Profil** - Personalizace a nastavení účtu
- **Responzivní Design** - Funguje na všech zařízeních
- **Bezpečné Přihlášení** - JWT autentizace pro ochranu dat

## Technologie

### Frontend
- **React** (TypeScript)
- **React Router** v6
- **Axios** pro API komunikaci
- Vlastní CSS (glassmorphism design)

### Backend
- **Django** 4.x
- **Django REST Framework**
- **Token Authentication** (JWT)
- **SQLite** databáze (development)

## Požadavky

Před spuštěním aplikace se ujistěte, že máte nainstalováno:

- **Python** 3.8 nebo vyšší
- **Node.js** 14.x nebo vyšší
- **npm** nebo **yarn**
- **pip** (Python package manager)

## Instalace a Spuštění

### 1. Stažení projektu

```bash
git clone https://github.com/your-username/plutoa.git
cd Zaverecny-projekt-master
```

### 2. Backend (Django)

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
python manage.py makemigrations
python manage.py migrate
```

#### Krok 4: Vytvoření superuživatele (volitelné)

```bash
python manage.py createsuperuser
```

Postupujte podle instrukcí a zadejte:
- Username (uživatelské jméno)
- Password (heslo)
- Password confirmation (potvrzení hesla)

#### Krok 5: Spuštění Django serveru

```bash
python manage.py runserver
```

Backend nyní běží na: **http://localhost:8000**

### 3. Frontend (React)

Otevřete **nový terminál** (nechte backend běžet) a přejděte do složky frontend:

#### Krok 1: Přejděte do složky frontend

```bash
cd frontend
```

#### Krok 2: Instalace závislostí

```bash
npm install
```

nebo pokud používáte yarn:

```bash
yarn install
```

#### Krok 3: Spuštění React aplikace

```bash
npm start
```

nebo s yarn:

```bash
yarn start
```

Frontend nyní běží na: **http://localhost:3000**

Aplikace se automaticky otevře v prohlížeči.

## Použití Aplikace

### První kroky

1. **Registrace**
   - Klikněte na "Registrace" na úvodní stránce
   - Vyplňte uživatelské jméno a heslo
   - Jméno a příjmení jsou volitelné

2. **Přihlášení**
   - Přihlaste se pomocí svého uživatelského jména a hesla
   - Budete přesměrováni na Dashboard

3. **Dashboard**
   - Zobrazuje přehled vašich financí
   - Celkové příjmy, výdaje a zůstatek
   - Poslední transakce

4. **Transakce**
   - Přidejte novou transakci (příjem nebo výdaj)
   - Kategorizujte transakce
   - Upravujte nebo mažte existující transakce

5. **Rozpočty**
   - Vytvořte měsíční rozpočet
   - Sledujte, kolik jste už utratili
   - Dostávejte přehled o zbývajících částkách

6. **Profil**
   - Upravte své osobní údaje
   - Změňte preferovanou měnu (CZK, EUR, USD, GBP)
   - Aktualizujte avatar

## Struktura Projektu

```
Zaverecny-projekt-master/
├── accounts/              # Django app - uživatelské účty
├── transactions/          # Django app - transakce
├── budgets/              # Django app - rozpočty
├── analytics/            # Django app - analytika
├── finance_platform/     # Django settings
├── frontend/             # React aplikace
│   ├── src/
│   │   ├── components/   # React komponenty
│   │   ├── contexts/     # React Context (AuthContext)
│   │   ├── services/     # API služby
│   │   └── styles/       # CSS soubory
│   └── public/
├── media/                # Nahrané soubory (avatary)
├── db.sqlite3           # SQLite databáze
├── manage.py            # Django management
└── requirements.txt     # Python závislosti
```

## API Endpointy

### Autentizace
- `POST /api/accounts/register/` - Registrace
- `POST /api/accounts/login/` - Přihlášení
- `GET /api/accounts/users/me/` - Aktuální uživatel
- `PATCH /api/accounts/users/update_profile/` - Aktualizace profilu

### Transakce
- `GET /api/transactions/` - Seznam transakcí
- `POST /api/transactions/` - Vytvoření transakce
- `PATCH /api/transactions/{id}/` - Úprava transakce
- `DELETE /api/transactions/{id}/` - Smazání transakce

### Rozpočty
- `GET /api/budgets/overview/` - Přehled rozpočtů
- `POST /api/budgets/` - Vytvoření rozpočtu

### Dashboard
- `GET /api/dashboard/overview/` - Dashboard data

## Řešení Problémů

### Backend nefunguje
```bash
# Zkontrolujte, zda je virtuální prostředí aktivováno
# Windows: venv\Scripts\activate
# Linux/Mac: source venv/bin/activate

# Zkontrolujte, zda jsou nainstalovány všechny závislosti
pip install -r requirements.txt

# Zkuste znovu spustit migrace
python manage.py migrate
```

### Frontend nefunguje
```bash
# Smažte node_modules a package-lock.json
rm -rf node_modules package-lock.json

# Přeinstalujte závislosti
npm install

# Zkuste vyčistit cache
npm cache clean --force
```

### CORS chyby
Ujistěte se, že v `finance_platform/settings.py` je správně nastaveno:
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
]
```

## Vývojové Poznámky

Pro podrobnou dokumentaci pro vývojáře viz:
- **[DEVELOPER_NOTES.md](./DEVELOPER_NOTES.md)** - Architektura, API, konvence kódu

## Licence

Tento projekt je vytvořen jako maturitní práce.

## Autor

**Plutoa Team**  
Vytvořeno v listopadu 2025

---

**Bavte se s Plutoa!**
