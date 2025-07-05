import React from 'react';
import { logoutUser } from '../services/auth';
import { Button } from "@/components/ui/button"

function LogoutButton({ setIsAuthenticated }) {
  const handleLogout = async () => {
    try {
      await logoutUser();
      console.log('Logged out successfully.');
      setIsAuthenticated(false);
    } catch (err) {
      console.error('Error while logging out:', err);
    }
  };

  return (
      <Button
        onClick={handleLogout}
        variant="destructive"
        className="font-semibold"
      >
        Cerrar Sesión
      </Button>
  );
}

export default LogoutButton;


