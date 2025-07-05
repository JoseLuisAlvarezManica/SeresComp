import React, { useState } from 'react';
import { loginUser } from '../services/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

const Login = ({ setIsAuthenticated }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { user, error } = await loginUser(email, password);
    if (user) setIsAuthenticated(true);
    else setError('Usuario o contraseña incorrecta.');
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center p-6">
      <Card className="w-full max-w-md bg-neutral-800 border border-neutral-700">
        <CardHeader>
          <h2 className="text-2xl font-bold text-center">Iniciar Sesión</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Correo electrónico</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-neutral-700"
              />
            </div>
            <div className="space-y-2">
              <Label>Contraseña</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-neutral-700"
              />
            </div>
            <Button type="submit" className="w-full">
              Iniciar Sesión
            </Button>
            {error && <p className="text-red-400 text-sm">{error}</p>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
