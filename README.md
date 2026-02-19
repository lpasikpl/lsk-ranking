# LSK Ranking - Ranking Kolarski

Aplikacja webowa z rankingiem kolarzy opartym na danych ze Stravy.

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Supabase** (PostgreSQL + Auth)
- **Tailwind CSS**
- **Vercel** (hosting)

## Setup

### 1. Sklonuj repozytorium i zainstaluj zależności

```bash
npm install
```

### 2. Skonfiguruj zmienne środowiskowe

Skopiuj `.env.local.example` do `.env.local` i uzupełnij:

```bash
cp .env.local.example .env.local
```

Wymagane zmienne:
- `STRAVA_CLIENT_ID` - z https://www.strava.com/settings/api
- `STRAVA_CLIENT_SECRET` - j.w.
- `NEXT_PUBLIC_SUPABASE_URL` - z projektu Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - j.w.
- `SUPABASE_SERVICE_ROLE_KEY` - j.w. (Settings > API)
- `NEXT_PUBLIC_APP_URL` - URL aplikacji (np. https://lsk.vercel.app)
- `SYNC_WEBHOOK_SECRET` - dowolny losowy ciąg znaków

### 3. Skonfiguruj Supabase

1. Wejdź w Supabase Dashboard > SQL Editor
2. Wklej i uruchom zawartość `supabase/schema.sql`

### 4. Skonfiguruj Strava API

W ustawieniach aplikacji Strava (`https://www.strava.com/settings/api`):
- **Authorization Callback Domain**: twoja-domena.vercel.app
- **Redirect URI**: `https://twoja-domena.vercel.app/api/auth/strava/callback`

### 5. Uruchom lokalnie

```bash
npm run dev
```

### 6. Nadaj uprawnienia admina

Po pierwszym logowaniu, w Supabase SQL Editor:

```sql
UPDATE users SET is_admin = true WHERE strava_id = TWOJE_STRAVA_ID;
```

## Synchronizacja n8n

### Konfiguracja webhooka

W n8n utwórz workflow z:
1. **Schedule Trigger** - co noc (np. `0 3 * * *`)
2. **HTTP Request** node:
   - Method: `POST`
   - URL: `https://twoja-domena.vercel.app/api/sync/webhook`
   - Headers: `Authorization: Bearer TWÓJ_SYNC_WEBHOOK_SECRET`

### Manualna synchronizacja

```bash
# Wszyscy użytkownicy
curl -X POST https://twoja-domena.vercel.app/api/sync/all \
  -H "Authorization: Bearer SYNC_WEBHOOK_SECRET"

# Pojedynczy użytkownik
curl -X POST https://twoja-domena.vercel.app/api/sync/user/USER_ID \
  -H "Authorization: Bearer SYNC_WEBHOOK_SECRET"
```

## Struktura projektu

```
src/
├── app/
│   ├── page.tsx              # Strona rankingu (Server Component)
│   ├── login/page.tsx        # Logowanie przez Stravę
│   ├── admin/
│   │   ├── page.tsx          # Panel admina (Server Component)
│   │   └── AdminClient.tsx   # Interaktywny panel (Client Component)
│   └── api/
│       ├── auth/
│       │   ├── strava/       # Redirect do Strava OAuth
│       │   ├── strava/callback/  # Callback OAuth
│       │   ├── logout/       # Wylogowanie
│       │   └── me/           # Dane zalogowanego użytkownika
│       ├── sync/
│       │   ├── webhook/      # Endpoint dla n8n
│       │   ├── all/          # Sync wszystkich
│       │   └── user/[userId] # Sync jednego użytkownika
│       ├── admin/
│       │   └── users/[userId] # Zarządzanie użytkownikami
│       └── ranking/          # API rankingu
├── components/
│   ├── RankingHeader.tsx     # Nagłówek z tytułem i auth
│   ├── PeriodNav.tsx         # Nawigacja miesiąc/rok
│   ├── Top3Table.tsx         # Tabela Top 3
│   ├── RankingTable.tsx      # Pełna tabela rankingu
│   └── Footer.tsx
├── lib/
│   ├── strava.ts             # Strava API + sync logic
│   ├── ranking.ts            # Logika rankingu
│   └── supabase/
│       ├── client.ts         # Browser client
│       └── server.ts         # Server client + service client
└── types/
    └── database.ts           # TypeScript typy
```

## Panel Admina

Dostępny pod `/admin` dla użytkowników z `is_admin = true`.

Funkcje:
- Lista wszystkich użytkowników
- Aktywacja/dezaktywacja użytkownika w rankingu
- Nadawanie/odbieranie uprawnień admina
- Ręczna synchronizacja pojedynczego użytkownika
- Ręczna synchronizacja wszystkich (wymaga podania sekretu)
- Przeglądanie logów synchronizacji

## Deploy na Vercel

```bash
vercel --prod
```

Dodaj zmienne środowiskowe w Vercel Dashboard > Settings > Environment Variables.
