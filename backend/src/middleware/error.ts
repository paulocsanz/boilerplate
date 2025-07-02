import { Elysia } from 'elysia';
import { UserError, handleDatabaseError } from '../errors/index.js';

const isDev = process.env.NODE_ENV === 'development';

export function error() {
  return new Elysia().onError(({ error, code, set }) => {
      console.error(`[${new Date().toISOString()}] Error ${code}:`, error);

      // Handle our custom errors
      if (error instanceof UserError) {
        set.status = error.statusCode;
        return {
          error: {
            message: error.message,
            code: error.code,
            statusCode: error.statusCode
          }
        };
      }

      // Handle database errors by converting them to UserErrors
      if ((error as any).code || (error as any).routine || (error as any).severity) {
        try {
          handleDatabaseError(error);
        } catch (userError) {
          if (userError instanceof UserError) {
            set.status = userError.statusCode;
            return {
              error: {
                message: userError.message,
                code: userError.code,
                statusCode: userError.statusCode,
                // Only show raw database error details in development
                ...(isDev && { details: (error as any).message })
              }
            };
          }
        }
      }

      // Handle validation errors (like missing fields)
      if (code === 'VALIDATION') {
        set.status = 422;
        return {
          error: {
            message: 'Invalid request data',
            code: 'VALIDATION_ERROR',
            statusCode: 422,
            details: error.message
          }
        };
      }

      // Handle not found errors
      if (code === 'NOT_FOUND') {
        set.status = 404;
        return {
          error: {
            message: 'Resource not found',
            code: 'NOT_FOUND',
            statusCode: 404
          }
        };
      }

      // For any other error, return a generic internal server error
      set.status = 500;
      return {
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR',
          statusCode: 500,
          // Only show raw error details in development
          ...(isDev && { details: (error as any).message })
        }
      };
    });
}