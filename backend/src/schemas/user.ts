import { t } from 'elysia';

export const CreateUserSchema = t.Object({
  username: t.String({ 
    minLength: 1,
    maxLength: 255,
    error: 'Username is required and must be between 1-255 characters'
  }),
  email: t.String({ 
    format: 'email',
    maxLength: 255,
    error: 'Valid email is required'
  })
});

export const UpdateUserSchema = t.Object({
  username: t.Optional(t.String({ 
    minLength: 1,
    maxLength: 255,
    error: 'Username must be between 1-255 characters'
  })),
  email: t.Optional(t.String({ 
    format: 'email',
    maxLength: 255,
    error: 'Valid email is required'
  }))
});

export const UserParamsSchema = t.Object({
  id: t.String({ 
    pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
    error: 'Invalid User ID format'
  })
});

export const UserResponseSchema = t.Object({
  id: t.String(),
  username: t.String(),
  email: t.String(),
  created_at: t.Date(),
  updated_at: t.Date()
});

export const UsersResponseSchema = t.Array(UserResponseSchema);

export const DeleteResponseSchema = t.Object({
  success: t.Boolean()
});