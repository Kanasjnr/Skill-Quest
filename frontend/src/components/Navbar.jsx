import React from 'react';

const Navbar = () => {
  return (
    <header className="w-full bg-[#0C0A20] relative z-50 ">
      {/* Optional background image behind the navbar */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/wave-bg.png')", // Replace with your own image
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          opacity: 0.2,
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
        {/* Logo */}
        <div className="text-2xl font-bold text-white">
          <span>SKILL</span>
          <span className="text-yellow-400">QUEST</span>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-white text-sm font-medium">
          <a href="#" className="hover:text-yellow-400 transition">Home</a>
          <a href="#" className="hover:text-yellow-400 transition">Features</a>
          <a href="#" className="hover:text-yellow-400 transition">How it works</a>
        </nav>

        {/* Connect Wallet Button */}
        <button className="bg-yellow-400 text-black hover:bg-yellow-300 px-4 py-2 rounded-full font-semibold text-sm transition">
          Connect Wallet
        </button>
      </div>
    </header>
  );
};

export default Navbar;
