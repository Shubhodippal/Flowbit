import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MicroFrontendLoader from './components/MicroFrontendLoader';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const { user, loading, screens } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Initializing Flowbit..." />;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Dynamic routes for micro-frontends */}
        {screens.map((screen) => (
          <Route
            key={screen.id}
            path={`/${screen.id}`}
            element={
              <MicroFrontendLoader
                url={screen.url}
                scope={screen.scope}
                module={screen.module}
              />
            }
          />
        ))}
        
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Catch all - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
