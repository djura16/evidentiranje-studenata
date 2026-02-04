# 🧠 Evidentiranje Studenata - Monorepo

Aplikacija za evidenciju prisustva studenata na časovima pomoću QR kodova.

## 🏗️ Struktura projekta

```
evidentiranje-studenata/
├── apps/
│   ├── backend/          # NestJS backend API
│   └── frontend/          # React frontend aplikacija
├── packages/
│   └── shared/            # Zajednički tipovi i DTO-i
└── package.json           # Root workspace konfiguracija
```

## 🎯 Opis projekta

Sistem za evidenciju prisustva studenata sa tri tipa korisnika:
- **Admin** - upravljanje korisnicima, pregled statistika
- **Profesor** - upravljanje predmetima, aktiviranje časova, generisanje QR kodova
- **Student** - skeniranje QR kodova, pregled prisustva

## 🚀 Brzo pokretanje

> 📖 Za detaljne instrukcije, pogledajte [QUICK_START.md](./QUICK_START.md)

### 1. Instalacija

```bash
# Instalacija svih dependencija (root + workspaces)
yarn install
```

### 2. Konfiguracija baze podataka

**Opcija A: Docker (preporučeno)**
```bash
docker-compose up -d mysql
```

**Opcija B: Lokalni MySQL**
- Kreirajte bazu `evidentiranje` i korisnika `evident_user`

### 3. Backend setup

```bash
# Kreirajte .env fajl
cp apps/backend/.env.example apps/backend/.env

# Seed podaci (kreira admin, profesor, student)
yarn seed

# Pokrenite backend
yarn backend:dev
```

Backend: http://localhost:5001 | Swagger: http://localhost:5001/api/docs

### 4. Frontend setup

```bash
# Pokrenite frontend
yarn frontend:dev
```

Frontend: http://localhost:3000

### Test korisnici (nakon seed-a)

- **Admin**: admin@example.com / password123
- **Profesor**: profesor@example.com / password123
- **Student**: student@example.com / password123

## ⚙️ Konfiguracija

### Backend (.env)

Kreirajte `apps/backend/.env` fajl:

```bash
# App
PORT=5001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=evident_user
DB_PASSWORD=evident_pass
DB_NAME=evidentiranje

# JWT
JWT_SECRET=super_secret_key_change_in_production
JWT_EXPIRATION=3600s
JWT_REFRESH_SECRET=super_refresh_secret_key_change_in_production
JWT_REFRESH_EXPIRATION=7d

# QR Code
QR_CODE_EXPIRATION_MINUTES=2
QR_CODE_BASE_URL=http://localhost:3000/attend?token=
```

## 🐳 Docker

```bash
# Pokretanje svih servisa
docker-compose up -d

# Pregled logova
docker-compose logs -f backend

# Zaustavljanje
docker-compose down
```

## 🌱 Seed podaci

```bash
yarn seed
```

Kreirani korisnici:
- **Admin**: admin@example.com / password123
- **Profesor**: profesor@example.com / password123
- **Student**: student@example.com / password123

## 📚 API Dokumentacija

Nakon pokretanja backend-a, Swagger dokumentacija je dostupna na:
- http://localhost:5001/api/docs

## 🔐 Autentifikacija

### Registracija
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "password123",
  "firstName": "Marko",
  "lastName": "Marković",
  "role": "STUDENT"
}
```

### Prijava
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "password123"
}
```

## 📋 API Endpoints

### Auth
- `POST /api/auth/register` - Registracija
- `POST /api/auth/login` - Prijava
- `POST /api/auth/refresh` - Osvežavanje tokena

### Users (zahteva autentifikaciju)
- `GET /api/users` - Lista korisnika (samo admin)
- `GET /api/users/:id` - Pregled korisnika
- `PATCH /api/users/:id` - Ažuriranje korisnika
- `DELETE /api/users/:id` - Brisanje korisnika (samo admin)
- `GET /api/users/statistics` - Statistika korisnika (samo admin)

### Subjects (zahteva autentifikaciju)
- `POST /api/subjects` - Kreiranje predmeta
- `GET /api/subjects` - Lista predmeta
- `GET /api/subjects/:id` - Pregled predmeta
- `PATCH /api/subjects/:id` - Ažuriranje predmeta
- `DELETE /api/subjects/:id` - Brisanje predmeta

### Classes (zahteva autentifikaciju)
- `POST /api/classes` - Kreiranje časa
- `GET /api/classes` - Lista časova
- `GET /api/classes/:id` - Pregled časa
- `PATCH /api/classes/:id` - Ažuriranje časa
- `DELETE /api/classes/:id` - Brisanje časa
- `POST /api/classes/:id/activate` - Aktiviranje časa i generisanje QR koda
- `POST /api/classes/:id/deactivate` - Deaktiviranje časa

### Attendance (zahteva autentifikaciju)
- `POST /api/attendance/scan?token=<uuid>` - Skeniranje QR koda
- `GET /api/attendance/my` - Moje prisustvo (studenti)
- `GET /api/attendance/class/:classSessionId` - Prisustvo za čas
- `GET /api/attendance/student/:studentId` - Prisustvo studenta
- `GET /api/attendance/statistics/:subjectId` - Statistika prisustva

### Statistics (zahteva autentifikaciju)
- `GET /api/statistics/dashboard` - Dashboard statistika (zavisi od uloge)

## 🧪 Testiranje

```bash
# Backend unit testovi
cd apps/backend
yarn test

# Backend E2E testovi
yarn test:e2e
```

## 📁 Struktura

### Backend (`apps/backend/`)
```
src/
 ├── auth/              # Autentifikacija i autorizacija
 ├── users/             # Upravljanje korisnicima
 ├── subjects/          # Upravljanje predmetima
 ├── classes/           # Upravljanje časovima
 ├── attendance/        # Evidencija prisustva
 ├── statistics/        # Statistika
 ├── common/            # Zajednički guardovi, decoratori, interceptori
 └── database/          # Seed skripte
```

### Frontend (`apps/frontend/`)
```
src/
 ├── components/        # React komponente
 ├── pages/             # Stranice
 ├── hooks/             # Custom hooks
 ├── services/          # API servisi
 ├── store/             # State management
 └── utils/             # Helper funkcije
```

### Shared (`packages/shared/`)
```
index.ts                # Zajednički tipovi, DTO-i, enumi
```

## 🔒 Bezbednost

- JWT autentifikacija sa access i refresh tokenima
- Role-based access control (RBAC)
- Validacija DTO-a
- Global exception filter
- Password hashing sa bcrypt

## 📝 License

MIT
