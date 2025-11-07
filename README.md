Osobní finanční plánovač

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
git clone https://github.com/TomasHoles/Zaverecny-projekt/
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

#### Krok 3: Spuštění Django serveru

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


