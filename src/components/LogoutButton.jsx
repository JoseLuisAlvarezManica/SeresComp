import React from 'react';
import { logoutUser } from '../services/auth';

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
    <button 
      onClick={handleLogout}
      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2
                 rounded font-semibold"
    >
      Cerrar Sesión
    </button>
  );
}

export default LogoutButton;