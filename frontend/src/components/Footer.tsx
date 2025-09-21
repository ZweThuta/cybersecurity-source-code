import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import React from 'react';

const Footer: React.FC = () => {
  return (
    <>
      <footer className="top-0 z-50 w-full glass">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b-[#B366FF] border-b-4">
          <div className="ml-12 mt-10">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-gaming rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">G</span>
              </div>
              <span className="text-lg sm:text-xl font-bold gradient-text">GameHub</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed">
              The ultimate multiplayer gaming experience. Connect, compete, and conquer with friends
              from around the world.
            </p>
          </div>
          <div className="ml-5 mt-10 max-w-48">
            <h3 className="font-semibold text-cyan-500 mb-3 flex items-center gap-2">
              <Icon icon="lucide:link" className="text-cyan-500 text-xl" />
              Quick Link
            </h3>
            <ul className="space-y-2 text-sm ml-7">
              <li>
                <Link to="/" className="hover:text-white">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white">
                  Profile
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white">
                  Games
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white">
                  Shop
                </Link>
              </li>
            </ul>
          </div>
          <div className="ml-5 mt-10 max-w-48">
            <h3 className="font-semibold text-purple-500 mb-3 flex items-center gap-2">
              <Icon icon="fluent:people-community-24-regular" className="text-purple-500 text-xl" />
              Community
            </h3>
            <ul className="space-y-2 text-sm ml-7">
              <li>
                <Link to="/" className="hover:text-white">
                  Friends
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white">
                  Chat Room
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white">
                  Leaderboards
                </Link>
              </li>
            </ul>
          </div>
          <div className="ml-5 mt-10 max-w-48">
            <h3 className="font-semibold text-yellow-500 mb-3 flex items-center gap-2">
              <Icon icon="ix:about" className="text-yellow-500 text-xl" />
              Support
            </h3>
            <ul className="space-y-2 text-sm ml-7">
              <li>
                <Link to="/" className="hover:text-white">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center justify-between p-8 text-lg">
          <p>&copy;2025 GamePlatform. All rights reserved.</p>
          <p className="flex items-center gap-1 mt-2 md:mt-0">
            Made with <Icon icon="solar:heart-bold" className="text-red-600 text-xl" /> for the
            gaming community.
          </p>
        </div>
      </footer>
    </>
  );
};

export default Footer;
