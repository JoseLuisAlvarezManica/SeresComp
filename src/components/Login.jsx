import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { loginUser } from '../services/auth';

const Login = ({ setIsAuthenticated }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const { user, error } = await loginUser(email, password);

    if (user) {
      setIsAuthenticated(true);
    } else {
      if (error) {
        setError("Usuario o contraseña incorrecta.");
        return;
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#181818] text-white">
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 flex-1">
        <div className="max-w-md w-full space-y-8 p-8 bg-[#232323] rounded-2xl shadow-lg border border-[#232323]">
          <div>
            <h2
              className="mt-6 text-center text-3xl font-extrabold tracking-tight"
              style={{ color: "#f4f4f5", letterSpacing: '1px' }} // Gris muy claro/blanco para título
            >
              Iniciar Sesión
            </h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div
                className="bg-[#ff4d4f22] border border-[#ff4d4f] text-[#ffbdbd] px-4 py-3 rounded relative"
                role="alert"
              >
                <strong className="font-bold">¡Error!</strong>
                <span className="block sm:inline"> {error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <input
                  type="email"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-[#3a3a3a]
                             bg-[#181818] text-white rounded-md focus:outline-none focus:ring-2
                             focus:ring-[#c5c5c7] focus:border-[#c5c5c7] sm:text-sm transition placeholder:text-[#c5c5c7]"
                  placeholder="Correo Electrónico"
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ fontWeight: 500 }}
                />
              </div>
              <div>
                <input
                  type="password"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-[#3a3a3a]
                             bg-[#181818] text-white rounded-md focus:outline-none focus:ring-2
                             focus:ring-[#c5c5c7] focus:border-[#c5c5c7] sm:text-sm transition placeholder:text-[#c5c5c7]"
                  placeholder="Contraseña"
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ fontWeight: 500 }}
                />
              </div>
            </div>

            <div>
              <Button
                type="submit"
                className="w-full py-2 px-4 rounded-md font-semibold bg-[#c5c5c7] text-[#181818] 
                           hover:bg-[#a5a5a7] focus:outline-none focus:ring-2 focus:ring-[#c5c5c7]
                           transition"
                style={{ fontWeight: 600 }}
              >
                Iniciar Sesión
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
