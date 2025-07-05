import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import LogoutButton from './LogoutButton';
import logoUrl from '../assets/logo.svg';

const NavBar = ({ setIsAuthenticated }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-[#202633] text-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">

          <div className="flex items-center space-x-4">
            <img src={logoUrl} alt="Logo" className="h-8 w-auto" />
            <Link
              to="/submit"
              className="text-white hover:text-[#A1A7B3] transition-colors px-3 py-2 text-sm font-medium"
            >
              Documentar
            </Link>
            <Link
              to="/analyze"
              className="text-white hover:text-[#A1A7B3] transition-colors px-3 py-2 text-sm font-medium"
            >
              Revisión
            </Link>
          </div>

          <div className="hidden md:block">
            <LogoutButton setIsAuthenticated={setIsAuthenticated} />
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white hover:text-[#A1A7B3] focus:outline-none"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                {isOpen ? (
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M6.225 4.811A1 1 0 017.64 3.396l4.36 4.36 4.36-4.36a1 1 0 011.415 1.415l-4.36 
                       4.36 4.36 4.36a1 1 0 01-1.415 1.415l-4.36-4.36-4.36 4.36a1 
                       1 0 01-1.415-1.415l4.36-4.36-4.36-4.36z"
                  />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-[#24293B] px-2 pt-2 pb-3 space-y-1">
          <Link
            to="/submit"
            onClick={() => setIsOpen(false)}
            className="block text-white hover:text-[#A1A7B3] px-3 py-2 rounded-md text-base font-medium"
          >
            Documentar
          </Link>
          <Link
            to="/analyze"
            onClick={() => setIsOpen(false)}
            className="block text-white hover:text-[#A1A7B3] px-3 py-2 rounded-md text-base font-medium"
          >
            Revisión
          </Link>
          <div className="border-t border-[#35394A] pt-3">
            <LogoutButton setIsAuthenticated={setIsAuthenticated} />
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
