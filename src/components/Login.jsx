import React, { useState } from 'react';
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
    <div className="min-h-screen flex flex-col bg-gray-900 text-white">
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 flex-1">
        <div className="max-w-md w-full space-y-8 p-8 bg-gray-800 rounded-lg shadow-lg">
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold">
              Iniciar Sesión
            </h2>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div
                className="bg-red-600/20 border border-red-600 text-red-300 px-4 py-3 rounded relative"
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
                  className="appearance-none block w-full px-3 py-2 border border-gray-700
                             bg-gray-900 text-white rounded-md focus:outline-none focus:ring-blue-500
                             focus:border-blue-500 sm:text-sm"
                  placeholder="Correo Electrónico"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <input
                  type="password"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-700
                             bg-gray-900 text-white rounded-md focus:outline-none focus:ring-blue-500
                             focus:border-blue-500 sm:text-sm"
                  placeholder="Contraseña"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent
                           text-sm font-medium rounded-md bg-blue-600 hover:bg-blue-700 focus:outline-none
                           focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Iniciar Sesión
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;