# BuckV1 Backend API

A robust Node.js TypeScript backend for the BuckV1 application with MVC architecture, using Prisma ORM and PostgreSQL.

## 🚀 Features

- **MVC Architecture**: Clean separation of concerns with Models, Views, and Controllers
- **TypeScript**: Full type safety across the application
- **Prisma ORM**: Type-safe database access with PostgreSQL
- **JWT Authentication**: Secure cookie-based authentication
- **Role-based Access Control**: Admin, Creator, and Member roles
- **Rate Limiting**: DDoS protection with express-rate-limit
- **Request Logging**: Comprehensive request logging with Winston
- **Error Handling**: Centralized error handling with custom error types
- **Input Validation**: Schema validation with Zod
- **Security**: Helmet for security headers, CORS configuration
- **Password Hashing**: Secure password storage with bcryptjs

## 📁 Project Structure

```
backend/
├── src/
│   ├── controllers/     # Request handlers
│   ├── services/        # Business logic (function-based)
│   ├── routes/          # API route definitions
│   ├── middleware/      # Custom middleware
│   ├── utils/           # Utility functions
│   └── server.ts        # Application entry point
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Database seeding
├── logs/               # Application logs
├── .env                # Environment variables
└── package.json
```

## 🛠 Setup Instructions

### Prerequisites

- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### Installation

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env .env.local
   ```
   Update the `.env` file with your database credentials:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/buckv1?schema=public"
   JWT_SECRET=random-secret-340d22
   PORT=8000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   ```

4. **Set up the database:**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run database migrations
   npx prisma migrate dev
   
   # Seed the database
   npx prisma db seed
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:8000`

## 🗄 Database Schema

### User Tables
- **Admins**: System administrators
- **Creators**: Content creators with analytics
- **Members**: Regular users with subscriptions

### Content Tables
- **Content**: User-generated content
- **Analytics**: Content performance metrics
- **Subscriptions**: Member subscriptions

## 🔐 Authentication

The API uses JWT tokens stored in HTTP-only cookies for authentication:

- **Login**: POST `/api/auth/login`
- **Signup**: POST `/api/auth/signup`
- **Logout**: POST `/api/auth/logout`
- **Profile**: GET `/api/auth/me`

### Test Credentials

After seeding, you can use these test accounts:

- **Admin**: `admin@buck.com` / `admin123`
- **Creator**: `john@buck.com` / `creator123`
- **Member**: `mike@buck.com` / `member123`

## 🛣 API Routes

### Auth Routes (`/api/auth`)
- `POST /login` - User login
- `POST /signup` - User registration
- `POST /logout` - User logout (protected)
- `GET /me` - Get current user (protected)

### Admin Routes (`/api/admin`) - Admin only
- `GET /analytics` - Dashboard analytics
- `GET /chart-data` - Chart data for dashboard
- `GET /recent-activity` - Recent platform activity
- `GET /users` - Get all users
- `DELETE /users/:userType/:userId` - Delete user
- `PATCH /users/:userType/:userId/toggle-status` - Toggle user status

### Creator Routes (`/api/creator`) - Creator only
- `GET /analytics` - Creator analytics
- `GET /chart-data` - Chart data
- `GET /recent-content` - Recent content
- `GET /content` - Get all content
- `POST /content` - Create new content
- `PUT /content/:id` - Update content
- `DELETE /content/:id` - Delete content
- `GET /profile` - Get creator profile
- `PUT /profile` - Update profile

### Member Routes (`/api/member`) - Member only
- `GET /dashboard` - Dashboard data
- `GET /recommendations` - Content recommendations
- `GET /subscriptions` - User subscriptions
- `POST /subscribe` - Subscribe to creator
- `DELETE /subscriptions/:id` - Unsubscribe
- `GET /profile` - Get member profile
- `PUT /profile` - Update profile

## 🔧 Scripts

```bash
# Development
npm run dev              # Start development server with nodemon

# Build
npm run build           # Compile TypeScript to JavaScript
npm start              # Start production server

# Database
npm run prisma:generate # Generate Prisma client
npm run prisma:migrate  # Run database migrations
npm run prisma:studio   # Open Prisma Studio
npm run prisma:seed     # Seed database with test data
```

## 🛡 Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Helmet**: Security headers for Express
- **CORS**: Configured for frontend domain
- **JWT**: Secure token-based authentication
- **Password Hashing**: bcryptjs with salt rounds
- **Input Validation**: Zod schema validation
- **Error Handling**: No sensitive data in error responses

## 📊 Logging

Request logging is implemented using Morgan and Winston:
- Console output for development
- File logging (`logs/combined.log`, `logs/error.log`)
- Structured logging with timestamps

## 🧪 Development Notes

- All services are function-based (not class-based)
- TypeScript strict mode enabled
- Prisma for type-safe database operations
- Centralized error handling
- Modular route organization
- JWT tokens in HTTP-only cookies for security

## 🚧 Production Deployment

1. Set `NODE_ENV=production`
2. Update `DATABASE_URL` for production database
3. Set secure `JWT_SECRET`
4. Configure CORS for production domain
5. Set up SSL/TLS certificates
6. Use a process manager (PM2, Docker, etc.)

## 📝 API Response Format

All API responses follow a consistent format:

```typescript
// Success Response
{
  success: true,
  message?: string,
  data?: any
}

// Error Response
{
  success: false,
  message: string,
  stack?: string // Only in development
}
```
# buck-backend
