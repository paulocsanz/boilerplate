import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserList } from './components/UserList';
import { CreateUserForm } from './components/CreateUserForm';

const queryClient = new QueryClient();

function App() {
  const [activeTab, setActiveTab] = useState<'users' | 'create'>('users');

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-8 px-4">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Fullstack Boilerplate
            </h1>
            <p className="text-gray-600 mt-2">
              A modern React + TypeScript + ElysiaJS + PostgreSQL boilerplate
            </p>
          </header>

          <nav className="mb-8">
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  activeTab === 'users'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Users
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  activeTab === 'create'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Create User
              </button>
            </div>
          </nav>

          <main>
            {activeTab === 'users' && <UserList />}
            {activeTab === 'create' && <CreateUserForm />}
          </main>
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default App;