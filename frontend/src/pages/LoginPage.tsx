import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { loginBg } from '@/assests';
import { FloatingElements, ParticleEffect } from '@/components';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useLoginMutation } from '@/features/auth/authApi';
import { setCredentials } from '@/features/auth/authSlice';
import { toast } from 'react-hot-toast';

interface FormState {
  email: string;
  password: string;
}

interface ErrorState {
  email?: string;
  password?: string;
}

const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState<FormState>({ email: '', password: '' });
  const [errors, setErrors] = useState<ErrorState>({});

  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();

  // --- Validation ---
  const validateField = (name: keyof FormState, value: string): string | undefined => {
    if (!value.trim()) return `Please enter your ${name}!`;

    if (name === 'email') {
      const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/;
      if (!emailRegex.test(value)) return 'Please enter a valid email address!';
    }

    if (name === 'password') {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;
      if (!passwordRegex.test(value))
        return 'Password must be at least 8 characters with uppercase, lowercase, number, and symbol';
    }

    return undefined;
  };

  const validateAllFields = (): boolean => {
    const newErrors: ErrorState = {
      email: validateField('email', form.email),
      password: validateField('password', form.password),
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  // --- Handle Login ---
  const handleLogin = async () => {
    if (!validateAllFields()) return;

    try {
      const res = await login({ email: form.email, password: form.password }).unwrap();
      dispatch(
        setCredentials({
          user: res.user,
          token: res.accessToken,
          refreshToken: res.refreshToken,
        }),
      );
      localStorage.setItem(
        'auth',
        JSON.stringify({
          user: res.user,
          token: res.accessToken,
          refreshToken: res.refreshToken,
        }),
      );
      toast.success('Welcome back!');
      navigate('/');
    } catch (err: any) {
      console.error('Login failed:', err);
      toast.error(err?.data?.message || 'Invalid credentials');
    }
  };

  return (
    <section className="flex flex-col md:flex-row h-screen font-inter bg-[#1C1825] overflow-hidden">
      <FloatingElements />
      <ParticleEffect />

      {/* Left Side */}
      <div className="flex flex-col mt-20 lg:mt-0 justify-center px-8 md:px-16 lg:px-24 bg-[#1C1825] w-full md:w-3/5">
        <div className="mb-10">
          <h1 className="text-2xl font-extrabold text-white">
            Game<span className="text-[#9C6CFE]">Hub</span>
          </h1>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-extrabold text-white">Welcome Back!</h1>
          <p className="text-gray-300 mt-3 text-sm md:text-base leading-relaxed">
            Champion! Log in with your username and password to start your journey!
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center mb-5">
          <hr className="flex-grow border-t border-gray-600" />
          <span className="mx-2 text-gray-400 text-sm">OR</span>
          <hr className="flex-grow border-t border-gray-600" />
        </div>

        {/* Email Input */}
        <div className="relative mb-4">
          <Icon icon="eva:email-outline" className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Enter your email"
            className={`w-full pl-10 pr-4 py-3 rounded-md bg-[#2A2633] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9C6CFE] ${
              errors.email ? 'border border-red-500' : 'border-transparent'
            }`}
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        {/* Password Input */}
        <div className="relative mb-4">
          <Icon icon="si:lock-line" className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Enter your password"
            className={`w-full pl-10 pr-10 py-3 rounded-md bg-[#2A2633] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9C6CFE] ${
              errors.password ? 'border border-red-500' : 'border-transparent'
            }`}
          />
          <Icon
            icon={showPassword ? 'iconamoon:eye-off-duotone' : 'iconamoon:eye-duotone'}
            className="absolute right-3 top-3 text-gray-400 w-5 h-5 cursor-pointer"
            onClick={() => setShowPassword(!showPassword)}
          />
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
        </div>

        {/* Forgot Password */}
        <Link
          to="/forgot-password"
          className="mb-6 text-right text-sm text-[#7A41DC] hover:underline"
        >
          Forgot password?
        </Link>

        {/* Login Button */}
        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full py-3 rounded-full bg-[#9C6CFE] text-white font-semibold text-lg shadow-lg hover:opacity-90 transition flex items-center justify-center"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Signing in...</span>
            </div>
          ) : (
            'Login'
          )}
        </button>

        {/* Sign Up */}
        <div className="text-center text-white text-sm mt-4">
          Don’t have an account?{' '}
          <Link to="/sign-up" className="text-[#7A41DC] hover:underline">
            Sign Up
          </Link>
        </div>
      </div>

      {/* Right Side */}
      <div
        className="hidden md:flex w-full md:w-1/2 bg-cover bg-center relative"
        style={{ backgroundImage: `url(${loginBg})` }}
      >
        <div className="absolute top-5 right-5 flex gap-3">
          <Link
            to="/sign-up"
            className="px-7 py-2 text-white font-semibold rounded-full hover:opacity-80 hover:underline transition"
          >
            Sign Up
          </Link>
          <Link
            to="/login"
            className="px-7 py-2 text-sm text-center text-black font-semibold bg-white border border-white rounded-full hover:bg-white hover:text-black transition"
          >
            Join Us
          </Link>
        </div>
      </div>
    </section>
  );
};

export default LoginPage;
