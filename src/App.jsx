import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/auth';

import Scanner from './components/Scanner';
import DocumentViewer from './components/DocumentViewer';
import Login from './components/Login';
import NavBar from './components/NavBar';

export default function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

  return (
    <BrowserRouter>
    
      <div className="min-h-screen">
        {isAuthenticated && (
          <NavBar
            setIsAuthenticated={setIsAuthenticated}
          />
        )}

        <Routes>
          <Route
            path="/"
            element={
              isAuthenticated ? <Navigate to="/submit" /> : <Navigate to="/login" />
            }
          />

          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/submit" />
              ) : (
                <Login setIsAuthenticated={setIsAuthenticated} />
              )
            }
          />

          <Route
            path="/submit"
            element={
              isAuthenticated ? <Scanner /> : <Navigate to="/login" />
            }
          />

          <Route
            path="/analyze"
            element={
              isAuthenticated ? <DocumentViewer /> : <Navigate to="/login" />
            }
          />

          <Route
            path="*"
            element={<h2 className="text-center mt-10">Página no encontrada</h2>}
          />

        </Routes>
      </div>
    </BrowserRouter>
  );
}