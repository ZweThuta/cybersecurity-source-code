import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { FloatingElements, ParticleEffect } from '@/components';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useLoginMutation, useVerifyOtpMutation, useResendOtpMutation } from '@/features/auth/authApi';
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
  const [verifyOtp, { isLoading: verifying }] = useVerifyOtpMutation();
  const [resendOtp, { isLoading: resending }] = useResendOtpMutation();
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [otp, setOtp] = useState<string>("");

  const handleVerifyOtp = async () => {
    if (!pendingUserId || !otp) return;
    try {
      const res = await verifyOtp({ userId: pendingUserId, code: otp }).unwrap();
      if (res.accessToken && res.user) {
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
        toast.success('Logged in successfully');
        navigate('/');
      } else {
        toast.error('Invalid response');
      }
    } catch (e: any) {
      toast.error(e?.data?.message || 'OTP verification failed');
    }
  };

  const handleResendOtp = async () => {
    if (!pendingUserId) return;
    try {
      await resendOtp({ userId: pendingUserId }).unwrap();
      toast.success('OTP resent');
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to resend OTP');
    }
  };

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
      if (res.mfaRequired && res.userId) {
        setPendingUserId(res.userId);
        toast.success('OTP sent to your email.');
        return;
      }
      if (res.accessToken && res.user) {
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
        toast.success('Welcome to the system!');
        navigate('/');
        return;
      }
      toast.error('Unexpected response');
  const handleVerifyOtp = async () => {
    if (!pendingUserId || !otp) return;
    try {
      const res = await verifyOtp({ userId: pendingUserId, code: otp }).unwrap();
      if (res.accessToken && res.user) {
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
        toast.success('Logged in successfully');
        navigate('/');
      } else {
        toast.error('Invalid response');
      }
    } catch (e: any) {
      toast.error(e?.data?.message || 'OTP verification failed');
    }
  };

  const handleResendOtp = async () => {
    if (!pendingUserId) return;
    try {
      await resendOtp({ userId: pendingUserId }).unwrap();
      toast.success('OTP resent');
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to resend OTP');
    }
  };
    } catch (err: any) {
      console.error('Login failed:', err);
      toast.error(err?.data?.message || 'Invalid credentials');
    }
  };

  return (
    <section className="flex flex-col md:flex-row md:justify-center h-screen font-inter overflow-hidden">
      <FloatingElements />
      <ParticleEffect />

      <div className="flex flex-col mt-20 lg:mt-0 justify-center px-8 md:px-16 w-full lg:w-1/2">
        <div className="mb-10">
          <h1 className="text-2xl font-extrabold flex gap-1 items-center text-white">
            <Icon icon="mdi:shield-lock" className="w-7 h-7 text-white" /> Access
            <span className="text-[#9C6CFE]">Hub</span>
          </h1>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-extrabold text-white">Login Here!</h1>
          <p className="text-gray-300 mt-3 text-sm md:text-base leading-relaxed">
            A secure staff management system with token-based authentication.
          </p>
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

        {/* Login or OTP Step */}
        {pendingUserId ? (
          <div className="mt-4 space-y-3">
            <div className="relative">
              <Icon icon="mdi:onepassword" className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                className="w-full pl-10 pr-4 py-3 rounded-md bg-[#2A2633] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9C6CFE]"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleVerifyOtp}
                disabled={verifying}
                className="flex-1 py-3 rounded-full bg-[#9C6CFE] text-white font-semibold text-lg shadow-lg hover:opacity-90 transition"
              >
                {verifying ? 'Verifying…' : 'Verify OTP'}
              </button>
              <button
                onClick={handleResendOtp}
                disabled={resending}
                className="px-4 rounded-full bg-[#3A3446] text-white font-semibold hover:opacity-90 transition"
              >
                {resending ? 'Resending…' : 'Resend'}
              </button>
            </div>
            <p className="text-gray-400 text-sm">We sent an OTP to your email. It expires in 5 minutes.</p>
          </div>
        ) : (
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
        )}

        {/* Sign Up */}
        <div className="text-center text-white text-sm mt-4">
          Don’t have an account?{' '}
          <Link to="/sign-up" className="text-[#7A41DC] hover:underline">
            Sign Up
          </Link>
        </div>
      </div>
    </section>
  );
};

export default LoginPage;
