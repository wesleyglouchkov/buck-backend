# Quick Start Guide

## 🚀 Getting Started

### 1. Database Setup (PostgreSQL Required)

Make sure PostgreSQL is installed and running, then update the `.env` file with your database connection:

```bash
# Update this line with your actual database credentials
DATABASE_URL="postgresql://username:password@localhost:5432/buckv1?schema=public"
```

### 2. Initialize Database

```bash
# Create and apply database migrations
npx prisma migrate dev --name init

# Seed the database with test data
npx prisma db seed
```

### 3. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:8000`

### 4. Test the API

You can test the API using the seeded test accounts:

**Login Endpoint:** `POST http://localhost:8000/api/auth/login`

```json
{
  "email": "admin@buck.com",
  "password": "admin123"
}
```

**Test Accounts:**
- **Admin:** `admin@buck.com` / `admin123`
- **Creator:** `john@buck.com` / `creator123`
- **Member:** `mike@buck.com` / `member123`

### 5. Frontend Integration

Update your frontend API calls to point to `http://localhost:8000/api`

The backend includes CORS configuration for `http://localhost:3000` by default.

## 🔧 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npx prisma studio` - Open database GUI
- `npx prisma migrate dev` - Create new migration
- `npx prisma db seed` - Seed database

## ⚡ Quick API Tests

Test login:
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@buck.com","password":"admin123"}'
```

Test health:
```bash
curl http://localhost:8000/health
```
