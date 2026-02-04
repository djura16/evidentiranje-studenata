# 🚀 Quick Start Guide

## Prerequisites

- Node.js 18+ i Yarn
- MySQL 8.0+ (ili Docker za MySQL)
- Git

## Korak 1: Instalacija dependencija

```bash
# U root direktorijumu projekta
yarn install
```

## Korak 2: Konfiguracija baze podataka

### Opcija A: Lokalni MySQL

1. Kreirajte MySQL bazu:
```sql
CREATE DATABASE evidentiranje;
CREATE USER 'evident_user'@'localhost' IDENTIFIED BY 'evident_pass';
GRANT ALL PRIVILEGES ON evidentiranje.* TO 'evident_user'@'localhost';
FLUSH PRIVILEGES;
```

### Opcija B: Docker (preporučeno)

```bash
# Pokrenite samo MySQL
docker-compose up -d mysql

# Sačekajte da se MySQL pokrene (oko 10-20 sekundi)
```

## Korak 3: Backend konfiguracija

1. Kreirajte `.env` fajl u `apps/backend/`:

```bash
# Windows PowerShell
Copy-Item apps/backend/.env.example apps/backend/.env

# Linux/Mac
cp apps/backend/.env.example apps/backend/.env
```

2. Ako koristite lokalni MySQL, ažurirajte `apps/backend/.env`:
```env
DB_HOST=localhost
```

3. Ako koristite Docker MySQL, ostavite:
```env
DB_HOST=mysql
```

## Korak 4: Seed podaci

```bash
# Kreirajte inicijalne korisnike
yarn seed
```

Ovo će kreirati:
- **Admin**: admin@example.com / password123
- **Profesor**: profesor@example.com / password123
- **Student**: student@example.com / password123

## Korak 5: Pokretanje Backend-a

```bash
# U jednom terminalu
yarn backend:dev
```

Backend će biti dostupan na: http://localhost:5001
Swagger dokumentacija: http://localhost:5001/api/docs

## Korak 6: Pokretanje Frontend-a

```bash
# U drugom terminalu
yarn frontend:dev
```

Frontend će biti dostupan na: http://localhost:3000

## ✅ Gotovo!

Sada možete:
1. Otvoriti http://localhost:3000 u browseru
2. Prijaviti se sa jednim od seed korisnika
3. Testirati funkcionalnosti

## 🐳 Alternativa: Docker (sve odjednom)

```bash
# Pokrenite sve servise (MySQL + Backend)
docker-compose up -d

# Pregled logova
docker-compose logs -f backend

# Seed podaci (nakon što se backend pokrene)
yarn seed

# Frontend još uvek treba da pokrenete lokalno
yarn frontend:dev
```

## 🔧 Troubleshooting

### Problem: "Cannot connect to database"
- Proverite da li je MySQL pokrenut
- Proverite `DB_HOST` u `.env` fajlu
- Ako koristite Docker, proverite da li je container pokrenut: `docker ps`

### Problem: "Port 5001 already in use"
- Promenite `PORT` u `apps/backend/.env`
- Ili zaustavite proces koji koristi port 5001

### Problem: "Port 3000 already in use"
- Vite će automatski pokušati sledeći port (3001, 3002, itd.)
- Ili promenite port u `apps/frontend/vite.config.ts`

### Problem: "Module not found" ili "Cannot find package"
- Pokrenite `yarn install` ponovo
- Proverite da li ste u root direktorijumu projekta

## 📝 Napomene

- Backend koristi TypeORM sa `synchronize: true` u development modu (automatski kreira tabele)
- Frontend koristi Vite sa hot reload
- Sve promene u kodu će se automatski reflektovati (osim ako ne zahtevaju restart)
