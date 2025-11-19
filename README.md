# Plutoa - Personal Finance Manager

> Moderní webová aplikace pro komplexní správu osobních financí s AI-powered insights a pokročilými vizualizacemi.
> 
---

## Popis Projektu

Plutoa je moderní Progressive Web Application pro správu osobních financí. Aplikace kombinuje intuitivní uživatelské rozhraní s pokročilými analytickými nástroji a AI-powered insights pro kompletní kontrolu nad vašimi financemi.

### Co Plutoa umí?

- Sledování příjmů a výdajů s kategorizací  
- Vytváření a monitoring rozpočtů  
- Pokročilé vizualizace (Heatmap, Waterfall, Pie Charts)  
- AI-powered finanční doporučení  
- Real-time budget alerts  
- CSV Import/Export transakcí  
- Dark/Light mode  
- Offline funkčnost (PWA)  
- Instalovatelná jako nativní aplikace  

---

## Klíčové Funkce

### Advanced Analytics

- Heatmap Calendar – vizualizace denní aktivity za 3 měsíce  
- Waterfall Chart – kaskádový graf cash flow  
- Category Distribution – interaktivní pie charty pro příjmy/výdaje  
- Trend Analysis – automatická detekce trendů  
- Financial Health Score – celkové hodnocení finančního zdraví (0–100)

### AI-Powered Insights

- Automatická detekce neobvyklých výdajů  
- Personalizovaná doporučení na úspory  
- Upozornění na překročení rozpočtu  
- Analýza spending patterns  
- Rozšiřitelné insight cards s detaily

### Smart Budget Alerts

- Real-time monitoring rozpočtů  
- Automatické alerty při 80 %, 90 %, 100 % využití  
- Toast notifications  
- Barevné indikátory závažnosti

### Progressive Web App

- Instalovatelná jako nativní aplikace  
- Offline podpora pomocí service workeru  
- Cache-first strategie pro rychlé načítání  
- Network-first pro API data


### Data Management

- CSV Import s drag & drop rozhraním  
- CSV Export pro zálohu dat  
- Hromadný import transakcí  
- Automatická validace dat

### Bezpečnost

- JWT token autentizace  
- Password reset s email verifikací  
- CSRF protection  
- Secure token generation

---

## Technologie

### Frontend

- React 19.1.1 (TypeScript)  
- React Router v6  
- Axios 1.12.2  
- Recharts 3.4.1  
- PWA se service workerem  
- Vlastní CSS (glassmorphism + prism effects)

### Backend

- Django 5.2.8  
- Django REST Framework 3.16.1  
- djangorestframework-simplejwt 5.5.1  
- SQLite (development) / PostgreSQL (production ready)

---

## Požadavky

- Python 3.10+  
- Node.js 18.x+  
- npm nebo yarn  
- pip

---

## Instalace a Spuštění

### 1. Stažení projektu
```bhttps://github.com/TomasHoles/Zaverecny-projekt.git
cd Zaverecny-projektash
git clone 


```bash
git clone https://github.com/TomasHoles/Zaverecny-projekt.git
cd Zaverecny-projekt
```

### 2. Backend Setup (Django)

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

### 3. Frontend Setup (React)

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

Frontend nyní běží na: **http://localhost:3000**
Aplikace se automaticky otevře v prohlížeči


