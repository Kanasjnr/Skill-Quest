import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-[#1e782c33] text-white px-6 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        {/* Left: Branding */}
        <div className="text-center md:text-left text-sm">
          Skillquest © 2025
        </div>

        {/* Center: Navigation Links */}
        <div className="flex flex-col sm:flex-row gap-4 text-center text-sm">
          <a href="#" className="hover:text-yellow-300 transition">About</a>
          <a href="#" className="hover:text-yellow-300 transition">Privacy</a>
          <a href="#" className="hover:text-yellow-300 transition">Terms</a>
        </div>

        {/* Right: Social Icons */}
        <div className="flex justify-center gap-4">
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
            <img src="/assets/likdin.png" alt="LinkedIn" className="h-6 w-6 hover:opacity-80 transition" />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
            <img src="/assets/instagram.png" alt="Instagram" className="h-6 w-6 hover:opacity-80 transition" />
          </a>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer">
            <img src="/assets/git.png" alt="GitHub" className="h-6 w-6 hover:opacity-80 transition" />
          </a>
        </div>
      </div>
    </footer>
  );
}
