import { useState, useEffect } from 'react';
import Scanner from './components/Scanner';
import DocumentViewer from './components/DocumentViewer';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/auth';


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
    
      <div className="min-h-screen bg-gray-900 text-white">
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
                <LoginForm setIsAuthenticated={setIsAuthenticated} />
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