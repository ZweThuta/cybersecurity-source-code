import { FloatingElements, ParticleEffect } from '@/components';
import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useRegisterMutation } from '@/features/auth/authApi';
import { toast } from 'react-hot-toast';

interface FormState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
}

interface ErrorState {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
}

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    terms: false,
  });

  const [errors, setErrors] = useState<ErrorState>({});
  const [register, { isLoading }] = useRegisterMutation();

  // --- Password strength ---
  const { score, label, color, width } = useMemo(() => {
    const pwd = form.password || '';
    if (!pwd) return { score: 0, label: 'Enter a password', color: 'bg-gray-600', width: 'w-0' };
    let s = 0;
    if (pwd.length >= 8) s += 1;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) s += 1;
    if (/\d/.test(pwd)) s += 1;
    if (/[^\w\s]/.test(pwd)) s += 1;

    // Map to 3 levels: weak (<=2), strong (3), very strong (4+)
    if (s <= 2) return { score: s, label: 'Weak', color: 'bg-red-500', width: 'w-1/3' };
    if (s === 3) return { score: s, label: 'Strong', color: 'bg-yellow-400', width: 'w-2/3' };
    return { score: s, label: 'Very strong', color: 'bg-green-500', width: 'w-full' };
  }, [form.password]);

  // --- Validation ---
  const validateField = (name: keyof FormState, value: string | boolean): string | undefined => {
    switch (name) {
      case 'name':
        if (!value || (value as string).trim() === '') return 'Please enter your name!';
        if ((value as string).trim().length < 2) return 'Name must be at least 2 characters!';
        if ((value as string).trim().length > 50) return 'Name must be at most 50 characters!';
        break;

      case 'email':
        if (!value || (value as string).trim() === '') return 'Please enter your email!';
        if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/.test(value as string))
          return 'Invalid email address!';
        break;

      case 'password':
        if (!value || (value as string).trim() === '') return 'Please enter your password!';
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/.test(value as string))
          return 'Password must be at least 8 characters with uppercase, lowercase, number, and symbol';
        break;

      case 'confirmPassword':
        if (!value || (value as string).trim() === '') return 'Please confirm your password!';
        if ((value as string) !== form.password) return 'Passwords do not match!';
        break;

      case 'terms':
        if (!value) return 'You must accept the terms and conditions!';
        break;
    }
    return undefined;
  };

  const validateAllFields = (): boolean => {
    const newErrors: ErrorState = {
      name: validateField('name', form.name),
      email: validateField('email', form.email),
      password: validateField('password', form.password),
      confirmPassword: validateField('confirmPassword', form.confirmPassword),
      terms: validateField('terms', form.terms),
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  // --- Handle Register ---
  const handleSignUp = async () => {
    if (!validateAllFields()) return;

    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
      }).unwrap();

      toast.success('Registration successful!');
      navigate('/login');
    } catch (err: any) {
      console.error('Register failed:', err);
      toast.error(err?.data?.message || 'Registration failed');
    }
  };

  return (
    <section className="flex flex-col md:flex-row md:justify-center min-h-screen font-inter overflow-hidden">
      <FloatingElements />
      <ParticleEffect />
      <div className="flex flex-col mt-20 mb-10 lg:mb-0 lg:mt-0 justify-center px-8 md:px-16 lg:px-24 w-full lg:w-1/2">
        {/* Logo */}
        <div className="mb-10">
          <h1 className="text-2xl font-extrabold flex gap-1 items-center text-white">
            <Icon icon="mdi:shield-lock" className="w-7 h-7 text-white" /> Access
            <span className="text-[#9C6CFE]">Hub</span>
          </h1>
        </div>

        {/* Heading */}
        <div className="mb-6 text-center md:text-left">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Register Here!</h1>
          <p className="text-gray-300 mt-3 text-sm md:text-base leading-relaxed">
            Register as a staff member and manage your profile securely.
          </p>
        </div>

        {/* Form Inputs */}
        <div className="space-y-4">
          {['name', 'email', 'password', 'confirmPassword'].map((field) => {
            const isPassword = field === 'password' || field === 'confirmPassword';
            const show = field === 'password' ? showPassword : showConfirmPassword;
            const toggle = field === 'password' ? setShowPassword : setShowConfirmPassword;
            const type = isPassword ? (show ? 'text' : 'password') : 'text';
            const placeholder =
              field === 'name'
                ? 'Enter your name'
                : field === 'email'
                  ? 'Enter your email'
                  : field === 'password'
                    ? 'Enter your password'
                    : 'Confirm your password';
            return (
              <div key={field} className="relative">
                <Icon
                  icon={isPassword ? 'si:lock-line' : 'basil:user-outline'}
                  className="absolute left-3 top-3 text-gray-400 w-5 h-5"
                />
                <input
                  type={type}
                  value={form[field as keyof FormState] as string}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  placeholder={placeholder}
                  className={`w-full pl-10 pr-10 py-3 rounded-md bg-[#2A2633] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9C6CFE] ${
                    errors[field as keyof ErrorState]
                      ? 'border border-red-500'
                      : 'border-transparent'
                  }`}
                />
                {isPassword && (
                  <Icon
                    icon={show ? 'iconamoon:eye-off-duotone' : 'iconamoon:eye-duotone'}
                    className="absolute right-3 top-3 text-gray-400 w-5 h-5 cursor-pointer"
                    onClick={() => toggle((prev) => !prev)}
                  />
                )}
                {errors[field as keyof ErrorState] && (
                  <p className="text-red-500 text-sm mt-1">{errors[field as keyof ErrorState]}</p>
                )}
              </div>
            );
          })}
        </div>
        {/* Password Progress Bar */}
        {
          form.password &&   <div className="my-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-300">Password strength</span>
            {form.password && (
              <span className={`text-sm ${label === 'Weak' ? 'text-red-400' : label === 'Strong' ? 'text-yellow-300' : 'text-green-400'}`}>{label}</span>
            )}
          </div>
          <div className="w-full h-2 bg-[#3a3446] rounded">
            <div className={`h-2 ${color} ${width} rounded transition-all duration-300`} />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Use at least 8 characters with uppercase, lowercase, number and symbol for best security.
          </p>
        </div>
        }
      

        {/* Terms */}
        <div className="flex flex-col mt-4 text-sm sm:text-base">
          <label className="flex items-center text-gray-400">
            <input
              type="checkbox"
              checked={form.terms}
              onChange={(e) => setForm({ ...form, terms: e.target.checked })}
              className="mr-2"
            />
            I agree to the{' '}
            <Link to="/terms-and-conditions" className="text-[#9C6CFE] hover:underline ml-1">
              Terms and Conditions
            </Link>
          </label>
          {errors.terms && <p className="text-red-500 text-sm mt-1">{errors.terms}</p>}
        </div>

        {/* Register Button */}
        <button
          onClick={handleSignUp}
          disabled={isLoading}
          className="w-full py-3 mt-6 rounded-full bg-[#9C6CFE] text-white font-semibold text-lg shadow-lg  hover:opacity-90 transition flex items-center justify-center"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Signing up...</span>
            </div>
          ) : (
            'Create an account'
          )}
        </button>

        {/* Already have an account */}
        <div className="text-center text-white text-sm mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-[#7A41DC] hover:underline">
            Login here!
          </Link>
        </div>
      </div>
    </section>
  );
};

export default RegisterPage;
