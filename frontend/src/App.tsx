import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { apiService } from './services/api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    // Check if user is already authenticated
    if (apiService.isAuthenticated()) {
      setIsAuthenticated(true);
      // You might want to decode the JWT to get the username
      setUsername('User'); // Placeholder
    }
  }, []);

  const handleLogin = (user: string) => {
    setIsAuthenticated(true);
    setUsername(user);
  };

  const handleLogout = () => {
    apiService.logout();
    setIsAuthenticated(false);
    setUsername('');
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="App">
        {isAuthenticated ? (
          <Dashboard username={username} onLogout={handleLogout} />
        ) : (
          <Login onLogin={handleLogin} />
        )}
      </div>
    </QueryClientProvider>
  );
}

export default App;