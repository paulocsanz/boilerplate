// Type definitions for the backend API
export interface User {
  id: string;
  username: string;
  email: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserRequest {
  username: string;
  email: string;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
}

export interface DeleteResponse {
  success: boolean;
}

// API App type based on the backend structure
export interface ApiApp {
  "/": {
    get: {
      response: {
        message: string;
        status: string;
      };
    };
  };
  "/api/users": {
    get: {
      response: User[];
    };
    post: {
      body: CreateUserRequest;
      response: User;
    };
  };
  "/api/users/:id": {
    get: {
      params: {
        id: string;
      };
      response: User;
    };
    put: {
      params: {
        id: string;
      };
      body: UpdateUserRequest;
      response: User;
    };
    delete: {
      params: {
        id: string;
      };
      response: DeleteResponse;
    };
  };
}