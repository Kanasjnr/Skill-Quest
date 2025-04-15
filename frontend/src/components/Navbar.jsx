import React from 'react';
import { Link } from 'react-router-dom'; // Import Link for internal navigation

const Navbar = () => {
  return (
    // Make header background transparent
    <header className="w-full bg-transparent absolute top-0 left-0 z-50">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        {/* Logo - All white */}
        <Link to="/" className="text-2xl font-bold text-white">
          SKILLQUEST
        </Link>

        {/* Navigation Links - Increased text size */}
        <nav className="hidden md:flex items-center space-x-8 text-white text-base font-medium">
          {/* Use Links or anchor tags as appropriate */}
          <Link to="/" className="hover:text-yellow-400 transition">Home</Link>
          <a href="/#features" className="hover:text-yellow-400 transition">Features</a>
          <a href="/#how-it-works" className="hover:text-yellow-400 transition">How it works</a>
        </nav>

        {/* Connect Wallet Button - Increased text size */}
        <button className="bg-yellow-400 text-black hover:bg-yellow-500 transition-colors px-5 py-2 rounded-full font-semibold text-base">
          Connect Wallet
        </button>
      </div>
    </header>
  );
};

export default Navbar;
