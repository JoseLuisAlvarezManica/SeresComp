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


  const blue = "#2563eb";
  const blueHover = "#1d4fd7";

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f8fa] text-black">
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 flex-1">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-2xl shadow-lg border border-[#ececec]">
          <div>
            <h2
              className="mt-6 text-center text-3xl font-extrabold tracking-tight"
              style={{ color: "#222", letterSpacing: '1px' }}
            >
              Iniciar Sesión
            </h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div
                className="bg-[#ff4d4f22] border border-[#ff4d4f] text-[#d7263d] px-4 py-3 rounded relative"
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
                  className="appearance-none block w-full px-3 py-2 border border-[#d3d3d3]
                             bg-[#f8fafc] text-black rounded-md focus:outline-none focus:ring-2
                             focus:ring-[#2563eb] focus:border-[#2563eb] sm:text-sm transition placeholder:text-[#8a8a8a]"
                  placeholder="Correo Electrónico"
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ fontWeight: 500 }}
                />
              </div>
              <div>
                <input
                  type="password"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-[#d3d3d3]
                             bg-[#f8fafc] text-black rounded-md focus:outline-none focus:ring-2
                             focus:ring-[#2563eb] focus:border-[#2563eb] sm:text-sm transition placeholder:text-[#8a8a8a]"
                  placeholder="Contraseña"
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ fontWeight: 500 }}
                />
              </div>
            </div>

            <div>
              <Button
                type="submit"
                className="w-full py-2 px-4 rounded-md font-semibold"
                style={{
                  background: blue,
                  color: "#fff",
                  fontWeight: 600,
                  transition: "background 0.2s",
                }}
                onMouseOver={e => e.currentTarget.style.background = blueHover}
                onMouseOut={e => e.currentTarget.style.background = blue}
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
