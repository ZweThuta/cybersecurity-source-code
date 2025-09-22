import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/features/auth/authSlice';
import { Icon } from '@iconify/react';
import { useSecurityEventsQuery } from '@/features/auth/authApi';

const Home: React.FC = () => {
  const user = useSelector(selectCurrentUser);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const { data: events, isLoading: eventsLoading } = useSecurityEventsQuery();

  const remainingText = useMemo(() => {
    if (remainingMs === null) return '—';
    if (remainingMs <= 0) return 'expired';
    const totalSeconds = Math.floor(remainingMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const parts = [] as string[];
    if (hours > 0) parts.push(`${hours}h`);
    parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);
    return parts.join(' ');
  }, [remainingMs]);

  useEffect(() => {
    const compute = () => {
      try {
        const stored = localStorage.getItem('auth');
        if (!stored) {
          setRemainingMs(null);
          return;
        }
        const { token } = JSON.parse(stored) as { token?: string };
        if (!token || token.split('.').length !== 3) {
          setRemainingMs(null);
          return;
        }
        const payloadJson = atob(token.split('.')[1]);
        const payload = JSON.parse(payloadJson) as { exp?: number; iat?: number };
        if (!payload?.exp) {
          setRemainingMs(null);
          return;
        }
        const ms = payload.exp * 1000 - Date.now();
        setRemainingMs(ms);
      } catch {
        setRemainingMs(null);
      }
    };

    compute();
    const id = setInterval(compute, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="min-h-screen  text-white p-8 font-inter space-y-8">
      {/* Welcome */}
      <div className="flex flex-col md:flex-row items-center justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold">
            Welcome, {user?.name || 'Staff Member'}!
          </h1>
          <p className="text-gray-300 mt-1">
            Email: <span className="text-[#9C6CFE]">{user?.email || 'loading...'}</span>
          </p>
          {/* <p className="text-gray-400 mt-1">Role: <span className="text-[#9C6CFE]">{user?.role || 'Staff'}</span></p> */}
        </div>
        <div className="flex gap-4 mt-4 md:mt-0">
          <button className="px-4 py-2 bg-[#3AB0FF]  rounded-md font-semibold hover:opacity-90 hover:scale-105 transition flex gap-2 items-center justify-center">
          <Icon icon="icon-park-twotone:info" className="w-5 h-5 text-white" />
            Learn More 
          </button>
          {/* <button className="px-4 py-2 bg-[#FF6B6B] rounded-lg font-semibold hover:opacity-90 transition">
            Logout
          </button> */}
        </div>
      </div>

      {/* Dashboard Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#2A2633] p-6 rounded-xl shadow-lg flex flex-col items-start">
          <Icon icon="mdi:shield-lock-outline" className="w-8 h-8 text-[#9C6CFE]" />
          <h2 className="text-xl font-semibold mt-2">Token Status</h2>
          <p className="text-gray-400 mt-1">Automatic token refresh: <span className="text-[#9C6CFE]">{remainingText}</span></p>
        </div>

        <div className="bg-[#2A2633] p-6 rounded-xl shadow-lg flex flex-col items-start">
          <Icon icon="material-symbols:password-rounded" className="w-8 h-8 text-[#9C6CFE]" />
          <h2 className="text-xl font-semibold mt-2">Secure Password</h2>
          <p className="text-gray-400 mt-1">Hashing and Salted with: <span className="text-[#9C6CFE]">Argon2</span></p>
        </div>

        <div className="bg-[#2A2633] p-6 rounded-xl shadow-lg flex flex-col items-start">
          <Icon icon="mdi:account-multiple-outline" className="w-8 h-8 text-[#9C6CFE]" />
          <h2 className="text-xl font-semibold mt-2">Active Users</h2>
          <p className="text-gray-400 mt-1">Currently online: <span className="text-[#9C6CFE]">12</span></p>
        </div>

        <div className="bg-[#2A2633] p-6 rounded-xl shadow-lg flex flex-col items-start">
          <Icon icon="mdi:bell-outline" className="w-8 h-8 text-[#9C6CFE]" />
          <h2 className="text-xl font-semibold mt-2">Notifications</h2>
          <p className="text-gray-400 mt-1">No new notifications</p>
        </div>

      
        {/* Recent Security Events */}
        <div className="bg-[#2A2633] p-6 rounded-xl shadow-lg flex flex-col items-start col-span-2">
          <Icon icon="mdi:history" className="w-8 h-8 text-[#9C6CFE]" />
          <h2 className="text-xl font-semibold mt-2">Recent Security Events</h2>
          <div className="mt-3 w-full">
            {eventsLoading && (<p className="text-gray-400 text-sm">Loading events…</p>)}
            {!eventsLoading && (!events || events.length === 0) && (
              <p className="text-gray-400 text-sm">No recent events</p>
            )}
            {!eventsLoading && events && (
              <ul className="text-gray-300 text-sm space-y-2">
                {events.slice(0,8).map((e, idx) => (
                  <li key={idx} className="flex items-start justify-between">
                    <div>
                      <span className="font-medium">{e.type}</span>
                      {e.userAgent && <span className="text-gray-400"> • {e.userAgent}</span>}
                      {e.ip && <span className="text-gray-400"> • {e.ip}</span>}
                    </div>
                    <span className="text-gray-400">{new Date(e.at).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Home;
