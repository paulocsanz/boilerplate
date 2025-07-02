import { User, AppContext } from '../db/database.js';
import { v4 as uuidv4 } from 'uuid';
import { NotFoundError } from '../errors/index.js';

export async function createUser(ctx: AppContext, username: string, email: string): Promise<User> {
  const userId = uuidv4();
  
  const [user] = await ctx.sql<User[]>`
    INSERT INTO users (id, username, email)
    VALUES (${userId}, ${username.trim()}, ${email.trim()})
    RETURNING *
  `;

  if (!user) {
    throw new Error('Failed to create user - no result returned');
  }

  return user;
}

export async function getUserById(ctx: AppContext, id: string): Promise<User> {
  const [user] = await ctx.sql<User[]>`
    SELECT * FROM users WHERE id = ${id}
  `;
  
  if (!user) {
    throw new NotFoundError('User');
  }

  return user;
}

export async function getUserByEmail(ctx: AppContext, email: string): Promise<User> {
  const [user] = await ctx.sql<User[]>`
    SELECT * FROM users WHERE email = ${email}
  `;
  
  if (!user) {
    throw new NotFoundError('User');
  }

  return user;
}

export async function updateUser(ctx: AppContext, id: string, updates: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>): Promise<User> {
  // First check if user exists
  await getUserById(ctx, id);

  const [user] = await ctx.sql<User[]>`
    UPDATE users 
    SET ${ctx.sql(updates)}
    WHERE id = ${id}
    RETURNING *
  `;

  if (!user) {
    throw new NotFoundError('User');
  }

  return user;
}

export async function deleteUser(ctx: AppContext, id: string): Promise<{ success: boolean }> {
  // First check if user exists
  await getUserById(ctx, id);

  const result = await ctx.sql`
    DELETE FROM users WHERE id = ${id}
  `;

  return { success: result.count > 0 };
}

export async function getAllUsers(ctx: AppContext): Promise<User[]> {
  return await ctx.sql<User[]>`
    SELECT * FROM users ORDER BY created_at DESC
  `;
}