import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="relative w-full bg-[#1C1825] text-gray-300 border-t border-[#2A2633]">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 px-8 md:px-16 lg:px-24 py-12">
        {/* Brand */}
        <div>
          <Link to="/" className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold flex gap-1 items-center text-white">
              <Icon icon="mdi:shield-lock" className="w-7 h-7 text-white" />
              Access<span className="text-[#9C6CFE]">Hub</span>
            </h1>
          </Link>
          <p className="mt-4 text-sm leading-relaxed text-gray-400">
            A secure, token-based authentication hub designed to protect your digital access with
            simplicity and strength.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/about" className="hover:text-[#9C6CFE]">
                About Us
              </Link>
            </li>
            <li>
              <Link to="/docs" className="hover:text-[#9C6CFE]">
                Documentation
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="hover:text-[#9C6CFE]">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-[#9C6CFE]">
                Contact
              </Link>
            </li>
          </ul>
        </div>

        {/* Resources */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Resources</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/support" className="hover:text-[#9C6CFE]">
                Support
              </Link>
            </li>
            <li>
              <Link to="/faq" className="hover:text-[#9C6CFE]">
                FAQs
              </Link>
            </li>
            <li>
              <Link to="/api" className="hover:text-[#9C6CFE]">
                API Access
              </Link>
            </li>
            <li>
              <Link to="/security" className="hover:text-[#9C6CFE]">
                Security
              </Link>
            </li>
          </ul>
        </div>

        {/* Social Media */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Follow Us</h3>
          <div className="flex space-x-4">
            <a href="#" target="_blank" rel="noreferrer">
              <Icon icon="mdi:github" className="w-6 h-6 hover:text-[#9C6CFE]" />
            </a>
            <a href="#" target="_blank" rel="noreferrer">
              <Icon icon="mdi:linkedin" className="w-6 h-6 hover:text-[#9C6CFE]" />
            </a>
            <a href="#" target="_blank" rel="noreferrer">
              <Icon icon="mdi:twitter" className="w-6 h-6 hover:text-[#9C6CFE]" />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="flex flex-col md:flex-row items-center justify-center px-8 md:px-16 lg:px-24 py-6 border-t border-[#2A2633] text-sm">
        <p>&copy; {new Date().getFullYear()} AccessHub. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
