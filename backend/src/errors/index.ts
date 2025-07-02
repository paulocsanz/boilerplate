export class UserError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode: number = 400, code?: string) {
    super(message);
    this.name = 'UserError';
    this.statusCode = statusCode;
    this.code = code || 'USER_ERROR';
  }
}

export class NotFoundError extends UserError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends UserError {
  constructor(message: string = 'Invalid input') {
    super(message, 422, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class DatabaseError extends Error {
  constructor(message: string, public originalError: any) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export function handleDatabaseError(error: any): never {
  console.error('Database error:', error);
  
  if (error.code === 'ECONNREFUSED' || error.message?.includes('connect')) {
    throw new UserError(
      'Service temporarily unavailable. Please try again later.',
      503,
      'SERVICE_UNAVAILABLE'
    );
  }
  
  if (error.code === '23505') { // PostgreSQL unique violation
    throw new UserError(
      'A record with this information already exists',
      409,
      'DUPLICATE_ENTRY'
    );
  }
  
  if (error.code === '23503') { // PostgreSQL foreign key violation
    throw new UserError(
      'Invalid reference to related data',
      400,
      'INVALID_REFERENCE'
    );
  }
  
  // For any other database error, throw a generic service error
  throw new UserError(
    'Service temporarily unavailable. Please try again later.',
    503,
    'SERVICE_ERROR'
  );
}