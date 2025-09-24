import { Icon } from '@iconify/react/dist/iconify.js';
import React, { useState } from 'react';
import { useVerifyOtpMutation } from '@/features/auth/authApi';
import toast from 'react-hot-toast';



const StepTwo: React.FC = () => {
  const data = {
    title: 'Verify Your Identity',
    description: 'We’ve sent a 5-digit OTP to your registered email. Enter it below to continue.',
    buttonText: 'Verify OTP',
  };

  const [otp, setOtpLocal] = useState(Array(6).fill(''));

  const [verifyOTP, { isLoading }] = useVerifyOtpMutation();

  const handleChange = (value: string, index: number) => {
    if (/^[0-9]?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtpLocal(newOtp);

      if (value && index < otp.length - 1) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const handleSubmit = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      toast.error('Please enter the complete 6-digit OTP');
      return;
    }

    try {

      toast.success('OTP verified successfully!');
    } catch (error: any) {
      console.error('OTP verification failed:', error);
      toast.error(error?.data?.message || 'Invalid OTP. Please try again.');
    }
  };

  return (
    <div className="bg-[#25252A] w-full min-h-[450px] justify-center flex flex-col max-w-lg border-2 border-[#9C6CFE] rounded-2xl p-6 sm:p-10 relative ">

      {/* Title + Description */}
      <div className="flex flex-col space-y-4 ">
        <span className="flex items-center gap-2 font-extrabold text-white text-xl md:text-2xl">
          <Icon icon="bitcoin-icons:verify-filled" className="text-3xl" />
          {data.title}
        </span>
        <p className="text-white text-xs md:text-sm font-medium leading-5 px-2">
          {data.description}
        </p>
      </div>

      {/* OTP Inputs */}
      <div className="flex justify-center gap-3 mt-6">
        {otp.map((digit, index) => (
          <input
            key={index}
            id={`otp-${index}`}
            type="text"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(e.target.value, index)}
            className="w-10 h-10 sm:w-14 sm:h-14 text-center text-lg font-bold rounded md:rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#9C6CFE] bg-white text-black"
          />
        ))}
      </div>

      {/* Verify Button */}
      <div className="mt-6">
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="bg-[#9C6CFE] text-white font-semibold rounded-full w-full border-2 border-white
         py-3 shadow-lg hover:opacity-90 transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Verifying...</span>
            </div>
          ) : (
            data.buttonText
          )}
        </button>
      </div>

      {/* Resend Link */}
      <p className="text-center text-gray-300 text-sm mt-4">
        Didn’t receive the code?{' '}
        <button
          className="text-[#9C6CFE] underline hover:opacity-80"
        >
          Resend OTP
        </button>
      </p>
    </div>
  );
};

export default StepTwo;
