import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import LogoutButton from './LogoutButton';

const NavBar = ({setIsAuthenticated }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-gray-800 shadow">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 justify-between">
          <div className="flex items-center">
                <>
                  <Link
                    to="/submit"
                    className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium"
                  >
                    Documentar
                  </Link>
                  <Link
                    to="/analyze"
                    className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium"
                  >
                    Revisión
                  </Link>
                </>
            </div>
          </div>

          <div className="hidden md:flex items-center">
            <LogoutButton setIsAuthenticated={setIsAuthenticated} />
          </div>

          <div className="flex md:hidden">
            <button
              type="button"
              className="text-gray-300 hover:text-white focus:outline-none"
              onClick={() => setIsOpen(!isOpen)}
            >

              {!isOpen ? (
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4 5h16v2H4zM4 11h16v2H4zM4 17h16v2H4z" />
                </svg>
              ) : (
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M6.225 4.811A1 1 0 017.64 3.396l4.36 4.36 4.36-4.36a1 1 0 011.415 1.415l-4.36 
                       4.36 4.36 4.36a1 1 0 01-1.415 1.415l-4.36-4.36-4.36 4.36a1 
                       1 0 01-1.415-1.415l4.36-4.36-4.36-4.36z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

      {isOpen && (
        <div className="md:hidden bg-gray-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              to="/submit"
              onClick={() => setIsOpen(false)}
              className="block text-gray-300 hover:text-white px-3 py-2 rounded text-base font-medium"
            >
              Documentar
            </Link>
            <Link
              to="/analyze"
              onClick={() => setIsOpen(false)}
              className="block text-gray-300 hover:text-white px-3 py-2 rounded text-base font-medium"
            >
              Revisión
            </Link>

            <div className="border-t border-gray-600 pt-3">
              <LogoutButton setIsAuthenticated={setIsAuthenticated} />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
