# Clinic Management & Billing System

A web-based administrative system for the Specialized Clinics Center in Kuwait. The system manages patient information, clinic visits, appointments, billing, payments, invoices, and provides operational overview.

## Tech Stack

### Frontend
- React 18
- Vite
- TypeScript
- React Router
- TailwindCSS
- TanStack Query

### Backend
- NestJS
- TypeScript
- PostgreSQL
- Prisma 5.22.0 (ORM)
- Docker

### Shared
- TypeScript shared types and utilities

## Repository Structure

```
clinic-system/
├── apps/
│   ├── web/          # Frontend application (React + Vite)
│   └── api/          # Backend application (NestJS)
├── packages/
│   └── shared/       # Shared types and utilities
├── docs/             # Project documentation
├── .github/
│   └── workflows/    # CI/CD configurations
├── docker-compose.yml          # Development Docker setup
├── docker-compose.prod.yml     # Production Docker setup
├── .env.example                 # Environment variables template
├── .gitignore                  # Git ignore rules
├── package.json                # Root package.json with workspaces
└── README.md                   # This file
```

## Local Setup

### Prerequisites
- Node.js 20+
- npm or yarn
- Docker (optional, for containerized development)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd clinic-system
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration (optional for development with defaults)

### Running the Application

#### Option 1: Local Development (without Docker)

1. Start PostgreSQL (ensure it's running on localhost:5432 or update DATABASE_URL in .env)

2. Start the backend:
```bash
npm run dev:api
```

3. Start the frontend (in a new terminal):
```bash
npm run dev:web
```

Or start both simultaneously:
```bash
npm run dev
```

The frontend will be available at http://localhost:3000
The backend will be available at http://localhost:3001/api

#### Option 2: Docker Development

1. Start all services:
```bash
docker-compose up
```

2. To stop services:
```bash
docker-compose down
```

### Building

Build all packages:
```bash
npm run build
```

Build individual packages:
```bash
npm run build:web
npm run build:api
```

## Docker Services

### Development (docker-compose.yml)
- **postgres**: PostgreSQL 16 on port 5432
- **api**: NestJS backend on port 3001 with hot-reload
- **web**: React frontend on port 3000 with hot-reload

### Production (docker-compose.prod.yml)
- **postgres**: PostgreSQL 16 on port 5432
- **api**: Production NestJS build on port 3001
- **web**: Production React build on port 80

## API Health Check

Once the backend is running, check health status:
```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Environment Variables

See `.env.example` for all available environment variables:

- `POSTGRES_USER`: PostgreSQL username
- `POSTGRES_PASSWORD`: PostgreSQL password
- `POSTGRES_DB`: PostgreSQL database name
- `PORT`: Backend port (default: 3001)
- `NODE_ENV`: Environment (development/production)
- `DATABASE_URL`: PostgreSQL connection string
- `FRONTEND_URL`: Frontend URL for CORS
- `VITE_API_URL`: Backend API URL for local development (defaults to `http://localhost:3001`; browser calls use the `/api` prefix)

## Development Guidelines

- This is a monorepo using npm workspaces
- Shared types and utilities go in `packages/shared`
- Frontend code goes in `apps/web`
- Backend code goes in `apps/api`
- Always use TypeScript for type safety
- Follow the existing code style and structure

## Documentation

- Project requirements: `docs/PROJECT_REQUIREMENTS.md`
- Database design: `docs/DATABASE_DESIGN.md`

## Prisma Version Note

**Prisma Version: 5.22.0**

This project uses Prisma version 5.22.0 instead of the latest version (7.x) due to schema configuration compatibility requirements. Prisma 7.x changed the schema format (moving the `url` property from the datasource to a separate config file), which would require significant refactoring of the current schema setup. Version 5.22.0 provides stable support for the current schema format with the `url` property in the datasource block.

**Migration History:**
- Initial schema: `apps/api/prisma/migrations/20260821201438_initial_schema/`
- CHECK constraints: `apps/api/prisma/migrations/20260821201439_add_check_constraints/`

## License

Private project for Specialized Clinics Center in Kuwait.
