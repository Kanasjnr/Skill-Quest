import React from 'react';
import { Linkedin, Instagram } from 'lucide-react'; // Using lucide-react for icons

export default function Footer() {
  return (
    // Background matching the Hero image bottom, adjust if needed
    <footer className="bg-[#130F26] text-white px-6 py-6 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Left: Branding */}
        <div className="text-center md:text-left text-sm text-gray-400">
          Skillquest © 2025
        </div>

        {/* Center: Navigation Links */}
        <div className="flex flex-col sm:flex-row gap-6 text-center text-sm">
          <a href="#" className="hover:text-yellow-400 transition text-gray-400">About</a>
          <a href="#" className="hover:text-yellow-400 transition text-gray-400">Privacy</a>
          <a href="#" className="hover:text-yellow-400 transition text-gray-400">Terms</a>
        </div>

        {/* Right: Social Icons */}
        <div className="flex justify-center gap-5">
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">
            <Linkedin size={20} />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">
            <Instagram size={20} />
          </a>
          {/* Assuming the third icon is Twitter/X */}
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">
             {/* Simple SVG for X icon */}
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
