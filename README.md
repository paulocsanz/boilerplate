# Fullstack Boilerplate

A modern, production-ready fullstack boilerplate featuring React, TypeScript, ElysiaJS, and PostgreSQL. Built with best practices and developer experience in mind.

## 🚀 Features

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: ElysiaJS + Bun runtime + PostgreSQL
- **Developer Experience**: Hot reload, TypeScript, ESLint, database migrations
- **Database**: PostgreSQL with migrations and schema management
- **API**: RESTful API with CORS support
- **UI**: Modern responsive design with Tailwind CSS
- **State Management**: React Query for server state

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **TypeScript** - Type safety and better DX
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Query** - Server state management
- **Lucide React** - Beautiful icons

### Backend
- **ElysiaJS** - Fast and modern Bun web framework
- **Bun** - JavaScript runtime and package manager
- **PostgreSQL** - Robust relational database
- **Database Migrations** - Schema versioning and management

## 📋 Prerequisites

- [Bun](https://bun.sh/) installed
- PostgreSQL database
- Node.js 18+ (for frontend tooling compatibility)

## 🚀 Getting Started

### 1. Clone and Install

```bash
git clone <your-repo>
cd boilerplate
bun install
```

### 2. Database Setup

**Option A: Automated Setup**
```bash
./setup-db.sh
```

**Option B: Manual Setup**

First, install PostgreSQL:
```bash
# macOS
brew install postgresql
brew services start postgresql

# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

Then create the database:
```bash
createdb boilerplate
```

### 3. Environment Configuration

**Backend** (`backend/.env`):
```env
DATABASE_URL=postgres://localhost:5432/boilerplate
NODE_ENV=development
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:3001
```

### 4. Run Database Migrations

```bash
# Run migrations
bun run dev:backend
# Or manually run migrations
cd backend && bun run db:migrate
```

### 5. Start Development

```bash
# Start both frontend and backend
bun run dev

# Or start individually
bun run dev:backend  # Backend on :3001
bun run dev:frontend # Frontend (Vite will auto-select available port)
```

**Note**: Vite will automatically find an available port starting from 5173. The actual port will be displayed in the terminal output.

## 📁 Project Structure

```
boilerplate/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── types/           # TypeScript types
│   │   ├── App.tsx          # Main app component
│   │   └── main.tsx         # Entry point
│   ├── public/              # Static assets
│   └── package.json
├── backend/                  # ElysiaJS backend
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── db/             # Database setup and migrations
│   │   │   ├── database.ts  # Database connection
│   │   │   ├── migrate.ts   # Migration runner
│   │   │   ├── schema.sql   # Current schema
│   │   │   └── migrations/  # Migration files
│   │   ├── index.ts        # Server entry point
│   │   └── types/          # TypeScript types
│   └── package.json
├── package.json             # Root workspace configuration
└── README.md
```

## 🔧 Available Scripts

### Root Level
- `bun run dev` - Start both frontend and backend
- `bun run build` - Build both for production
- `bun run lint` - Lint both projects
- `bun run typecheck` - Type check both projects

### Backend
- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run db:migrate` - Run pending migrations
- `bun run db:migrate:status` - Check migration status
- `bun run db:migrate:rollback` - Rollback last migration

### Frontend
- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run preview` - Preview production build

## 🗄️ Database Migrations

The boilerplate includes a robust migration system:

```bash
# Create a new migration
echo "-- Description of migration
CREATE TABLE example (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL
);" > backend/src/db/migrations/002_add_example_table.sql

# Run migrations
cd backend && bun run db:migrate

# Check status
bun run db:migrate:status

# Rollback if needed
bun run db:migrate:rollback
```

## 🌐 API Endpoints

The boilerplate includes a complete user management API:

- `GET /` - Health check
- `GET /api/users` - List all users
- `POST /api/users` - Create a new user
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## 🎨 Customization

### Adding New Models

1. **Create migration**:
```sql
-- backend/src/db/migrations/00X_add_posts.sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

2. **Add TypeScript types**:
```typescript
// backend/src/db/database.ts
export interface Post {
  id: string;
  title: string;
  content?: string;
  user_id: string;
  created_at: Date;
  updated_at: Date;
}
```

3. **Create controller**:
```typescript
// backend/src/controllers/posts.ts
export class PostsController {
  // CRUD operations
}
```

4. **Add routes**:
```typescript
// backend/src/index.ts
.group('/api/posts', (app) => 
  app
    .get('/', ({ postsController }) => postsController.getAllPosts())
    // ... more routes
)
```

### Environment Variables

Create `.env` files as needed:

**Backend `.env`**:
```env
DATABASE_URL=postgres://user:password@localhost:5432/dbname
NODE_ENV=development
PORT=3001
```

**Frontend `.env`**:
```env
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=My App
```

## 🚀 Deployment

### Backend (Railway/Render/fly.io)
1. Set `DATABASE_URL` environment variable
2. Build command: `bun run build`
3. Start command: `bun run start`

### Frontend (Vercel/Netlify)
1. Build command: `bun run build`
2. Output directory: `dist`
3. Set `VITE_API_URL` environment variable

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run linting and type checking
6. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

---

Built with ❤️ using modern web technologies. Perfect starting point for your next fullstack application!