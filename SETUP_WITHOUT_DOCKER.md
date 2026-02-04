# 🚀 Setup bez Docker-a (Lokalni MySQL)

Ako Docker Desktop ne radi, možete koristiti lokalni MySQL.

## Korak 1: Instalirajte MySQL

### Windows:
1. Preuzmite MySQL Installer: https://dev.mysql.com/downloads/installer/
2. Instalirajte MySQL Server 8.0+
3. Tokom instalacije, zapamtite root lozinku

### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

### Mac:
```bash
brew install mysql
brew services start mysql
```

## Korak 2: Kreirajte bazu podataka

Povežite se na MySQL:

```bash
# Windows (Command Prompt)
mysql -u root -p

# Linux/Mac
sudo mysql -u root -p
```

Zatim izvršite:

```sql
CREATE DATABASE evidentiranje;
CREATE USER 'evident_user'@'localhost' IDENTIFIED BY 'evident_pass';
GRANT ALL PRIVILEGES ON evidentiranje.* TO 'evident_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## Korak 3: Konfigurišite Backend

1. Kreirajte `.env` fajl:
```bash
# Windows PowerShell
Copy-Item apps/backend/.env.example apps/backend/.env

# Linux/Mac
cp apps/backend/.env.example apps/backend/.env
```

2. Ažurirajte `apps/backend/.env`:
```env
# App
PORT=5000
NODE_ENV=development

# Database - PROMENITE NA localhost
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

## Korak 4: Instalirajte dependencije

```bash
yarn install
```

## Korak 5: Seed podaci

```bash
yarn seed
```

## Korak 6: Pokrenite aplikaciju

**Terminal 1 - Backend:**
```bash
yarn backend:dev
```

**Terminal 2 - Frontend:**
```bash
yarn frontend:dev
```

## ✅ Gotovo!

- Backend: http://localhost:5000
- Frontend: http://localhost:3000
- Swagger: http://localhost:5000/api/docs

## Test korisnici

- Admin: admin@example.com / password123
- Profesor: profesor@example.com / password123
- Student: student@example.com / password123
