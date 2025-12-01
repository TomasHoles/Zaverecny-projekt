# Struktura projektu Plutoa

## 📁 Základní struktura

```
frontend/
├── src/
│   ├── components/          # React komponenty
│   ├── contexts/           # Context providers (Auth, Theme, Toast)
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API služby
│   ├── styles/             # CSS soubory
│   ├── utils/              # Pomocné funkce
│   ├── assets/             # Obrázky, ikony
│   ├── App.tsx             # Hlavní komponenta
│   └── index.tsx           # Entry point
└── public/                 # Statické soubory
```

## 🧩 Klíčové komponenty

### Layout komponenty
- **Navbar.tsx** - Horní navigace
- **Footer.tsx** - Patička

### Stránky
- **LandingPage.tsx** - Úvodní stránka (veřejná)
- **LoginForm.tsx** - Přihlášení
- **RegisterForm.tsx** - Registrace
- **Dashboard.tsx** - Hlavní přehled (po přihlášení)
- **Transactions.tsx** - Správa transakcí
- **Budgets.tsx** - Správa rozpočtů
- **Goals.tsx** - Finanční cíle
- **Analytics.tsx** - Analýzy a grafy
- **Profile.tsx** - Uživatelský profil
- **Notifications.tsx** - Notifikace

### Pomocné komponenty
- **Icon.tsx** - Ikony
- **Toast.tsx** - Notifikační zprávy
- **ProtectedRoute.tsx** - Ochrana přihlášených stránek
- **Prism.tsx** - Animované pozadí

## 🎨 Styly

Každá komponenta má vlastní CSS soubor:
- `Dashboard.css`
- `Navbar.css`
- `LandingPage.css`
- atd.

Globální styly:
- **App.css** - Základní styly a helper třídy
- **index.css** - Reset a základní nastavení

## 🔧 Contexty

- **AuthContext** - Správa přihlášení a uživatele
- **ThemeContext** - Tmavý/světlý režim
- **ToastContext** - Notifikační systém

## 🛣️ Routing

```typescript
/                    → LandingPage (veřejná)
/login              → LoginForm (veřejná)
/register           → RegisterForm (veřejná)
/dashboard          → Dashboard (chráněná)
/transactions       → Transactions (chráněná)
/budgets            → Budgets (chráněná)
/goals              → Goals (chráněná)
/analytics          → Analytics (chráněná)
/profile            → Profile (chráněná)
/notifications      → Notifications (chráněná)
```

## 📦 Hlavní balíčky

- **React** - UI framework
- **React Router** - Routing
- **OGL** - WebGL pro Prism animaci
- **Recharts** - Grafy a vizualizace

## 🎯 Důležité soubory

- **App.tsx** - Hlavní konfigurace aplikace a routing
- **api.ts** - Konfigurace API komunikace
- **dashboardService.ts** - Služby pro dashboard data

## 💡 Tipy

1. Všechny chráněné stránky jsou obaleny v `ProtectedRoute`
2. Toast komponenta pro notifikace
3. Helper CSS třídy v App.css (`flex`, `gap-*`, `mt-*`, atd.)
