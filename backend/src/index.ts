import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { createUser, getUserById, getAllUsers, updateUser, deleteUser } from './controllers/users.js';
import { MigrationRunner } from './db/migrate.js';
import { error } from './middleware/error.js';
import { createAppContext } from './db/database.js';
import { 
  CreateUserSchema, 
  UpdateUserSchema, 
  UserParamsSchema,
  UserResponseSchema,
  UsersResponseSchema,
  DeleteResponseSchema 
} from './schemas/user.js';

// Run migrations on startup
async function startServer() {
  console.log('🔄 Checking database connection...');
  const migrationRunner = new MigrationRunner();
  try {
    await migrationRunner.runMigrations();
    console.log('✅ Database migrations completed');
  } catch (error: any) {
    console.error('❌ Database connection failed:', error);
    
    // Provide specific error messages based on the error code
    if (error.code === '28P01') {
      console.log('💡 Authentication failed - check your database credentials');
      console.log('   - Verify DATABASE_URL in backend/.env');
      console.log('   - Check username/password are correct');
      console.log('   - Ensure user has access to the database');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('💡 Database connection refused:');
      console.log('   1. Start PostgreSQL service');
      console.log('   2. Check if PostgreSQL is running on the correct port');
    } else if (error.code === '3D000') {
      console.log('💡 Database does not exist:');
      console.log('   1. Create database: createdb boilerplate');
      console.log('   2. Or run: ./setup-db.sh');
    } else if (error.code === 'ENOTFOUND' || error.code === 'ENOENT') {
      console.log('💡 PostgreSQL not found:');
      console.log('   1. Install PostgreSQL: brew install postgresql (macOS) or apt-get install postgresql (Ubuntu)');
      console.log('   2. Start PostgreSQL service');
    } else {
      console.log('💡 Database connection issue:');
      console.log('   - Check DATABASE_URL environment variable');
      console.log('   - Ensure PostgreSQL is installed and running');
      console.log('   - Verify database exists: createdb boilerplate');
    }
    
    console.log('');
    console.log('🚀 Starting server anyway (API will return errors until database is configured)...');
  }

  const app = new Elysia()
    .use(cors())
    .use(error())
    .derive(() => ({
      ctx: createAppContext()
    }))
    
    // Health check
    .get('/', () => ({ message: 'Fullstack Boilerplate API', status: 'healthy' }))
    
    // Users routes with validation and type safety
    .group('/api/users', (app) =>
      app
        .get('/', async ({ ctx }) => {
          const users = await getAllUsers(ctx);
          return users;
        }, {
          response: UsersResponseSchema
        })
        .post('/', async ({ ctx, body }) => {
          const user = await createUser(ctx, body.username, body.email);
          return user;
        }, {
          body: CreateUserSchema,
          response: UserResponseSchema
        })
        .get('/:id', async ({ ctx, params }) => {
          const user = await getUserById(ctx, params.id);
          return user;
        }, {
          params: UserParamsSchema,
          response: UserResponseSchema
        })
        .put('/:id', async ({ ctx, params, body }) => {
          const user = await updateUser(ctx, params.id, body);
          return user;
        }, {
          params: UserParamsSchema,
          body: UpdateUserSchema,
          response: UserResponseSchema
        })
        .delete('/:id', async ({ ctx, params }) => {
          const result = await deleteUser(ctx, params.id);
          return result;
        }, {
          params: UserParamsSchema,
          response: DeleteResponseSchema
        })
    )
    
    .listen(process.env.PORT || 3001);

  return app;
}

const app = await startServer();

console.log(`🚀 Server is running at http://localhost:${app.server?.port}`);
console.log('📚 API Documentation:');
console.log('  GET  / - Health check');
console.log('  GET  /api/users - Get all users');
console.log('  POST /api/users - Create user');
console.log('  GET  /api/users/:id - Get user by ID');
console.log('  PUT  /api/users/:id - Update user');
console.log('  DELETE /api/users/:id - Delete user');
