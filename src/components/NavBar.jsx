import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import LogoutButton from './LogoutButton';

const NavBar = ({ isAdmin, isEmployee, setIsAuthenticated }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-gray-800 shadow">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 justify-between">
          {/* Left side: Brand */}
          <div className="flex items-center">
            <Link 
              to="/" 
              className="text-white font-bold text-xl hover:text-gray-200"
            >
              MyApp
            </Link>
            
            {/* Desktop Menu (hidden on small screens) */}
            <div className="ml-10 hidden md:flex items-center space-x-6">
              <Link
                to="/print"
                className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium"
              >
                Print Form
              </Link>
              {(isAdmin || isEmployee) && (
                <>
                  <Link
                    to="/manage"
                    className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium"
                  >
                    Printer Management
                  </Link>
                  <Link
                    to="/users"
                    className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium"
                  >
                    User List
                  </Link>
                  <Link
                    to="/prints"
                    className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium"
                  >
                    Prints List
                  </Link>
                  <Link
                    to="/failures"
                    className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium"
                  >
                    Failures List
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Right side: Logout (desktop) */}
          <div className="hidden md:flex items-center">
            <LogoutButton setIsAuthenticated={setIsAuthenticated} />
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              type="button"
              className="text-gray-300 hover:text-white focus:outline-none"
              onClick={() => setIsOpen(!isOpen)}
            >
              {/* Hamburger / X icon */}
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
      </div>

      {/* Mobile Menu (only visible when "isOpen") */}
      {isOpen && (
        <div className="md:hidden bg-gray-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              to="/print"
              onClick={() => setIsOpen(false)}
              className="block text-gray-300 hover:text-white px-3 py-2 rounded text-base font-medium"
            >
              Print Form
            </Link>
            {(isAdmin || isEmployee) && (
              <>
                <Link
                  to="/manage"
                  onClick={() => setIsOpen(false)}
                  className="block text-gray-300 hover:text-white px-3 py-2 rounded text-base font-medium"
                >
                  Printer Management
                </Link>
                <Link
                  to="/users"
                  onClick={() => setIsOpen(false)}
                  className="block text-gray-300 hover:text-white px-3 py-2 rounded text-base font-medium"
                >
                  User List
                </Link>
                <Link
                  to="/prints"
                  onClick={() => setIsOpen(false)}
                  className="block text-gray-300 hover:text-white px-3 py-2 rounded text-base font-medium"
                >
                  Prints List
                </Link>
                <Link
                  to="/failures"
                  onClick={() => setIsOpen(false)}
                  className="block text-gray-300 hover:text-white px-3 py-2 rounded text-base font-medium"
                >
                  Failures List
                </Link>
              </>
            )}
            {/* Mobile Logout */}
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
