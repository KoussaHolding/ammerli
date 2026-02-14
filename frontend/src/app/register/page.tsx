'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { authService } from '@/services/auth.service';
import { useRouter } from 'next/navigation';
import { Droplets, User, Phone, Lock, Loader2, Truck } from 'lucide-react';
import Link from 'next/link';

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  phone: z.string().min(10, 'Invalid phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['CLIENT', 'DRIVER']),
  driverType: z.string().optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'CLIENT' | 'DRIVER'>('CLIENT');
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'CLIENT' },
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.register(data);
      router.push('/login?registered=true');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 py-12 px-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-white p-10 rounded-[2.5rem] shadow-xl border border-zinc-100"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-200">
            <Droplets className="text-white h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter">Create Account</h1>
          <p className="text-zinc-500 mt-2">Join the Ammerli network today</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Role Selection */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <button
              type="button"
              onClick={() => { setSelectedRole('CLIENT'); }}
              className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition ${selectedRole === 'CLIENT' ? 'border-blue-600 bg-blue-50' : 'border-zinc-100'}`}
            >
              <User className={selectedRole === 'CLIENT' ? 'text-blue-600' : 'text-zinc-400'} />
              <span className={`text-sm font-bold ${selectedRole === 'CLIENT' ? 'text-blue-600' : 'text-zinc-400'}`}>I&apos;m a Client</span>
              <input type="radio" {...register('role')} value="CLIENT" className="hidden" checked={selectedRole === 'CLIENT'} readOnly />
            </button>
            <button
              type="button"
              onClick={() => { setSelectedRole('DRIVER'); }}
              className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition ${selectedRole === 'DRIVER' ? 'border-blue-600 bg-blue-50' : 'border-zinc-100'}`}
            >
              <Truck className={selectedRole === 'DRIVER' ? 'text-blue-600' : 'text-zinc-400'} />
              <span className={`text-sm font-bold ${selectedRole === 'DRIVER' ? 'text-blue-600' : 'text-zinc-400'}`}>I&apos;m a Driver</span>
              <input type="radio" {...register('role')} value="DRIVER" className="hidden" checked={selectedRole === 'DRIVER'} readOnly />
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold ml-1">First Name</label>
              <input
                {...register('firstName')}
                placeholder="John"
                className="w-full px-4 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-blue-500 transition outline-none"
              />
              {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold ml-1">Last Name</label>
              <input
                {...register('lastName')}
                placeholder="Doe"
                className="w-full px-4 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-blue-500 transition outline-none"
              />
              {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold ml-1">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
              <input
                {...register('phone')}
                placeholder="+213 555 555 555"
                className="w-full pl-12 pr-4 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-blue-500 transition outline-none"
              />
            </div>
            {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
              <input
                {...register('password')}
                type="password"
                placeholder="Create a strong password"
                className="w-full pl-12 pr-4 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-blue-500 transition outline-none"
              />
            </div>
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
          </div>

          {selectedRole === 'DRIVER' && (
            <div className="space-y-2">
              <label className="text-sm font-bold ml-1">Vehicle Type</label>
              <select
                {...register('driverType')}
                className="w-full px-4 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="MOTORCYCLE">Motorcycle (Small)</option>
                <option value="CAR">Car (Medium)</option>
                <option value="TRUCK">Truck (Large)</option>
              </select>
            </div>
          )}

          <button
            disabled={isLoading}
            type="submit"
            className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-lg shadow-blue-100 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create Account'}
          </button>
        </form>

        <p className="text-center mt-8 text-zinc-500 text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 font-black">Log In</Link>
        </p>
      </motion.div>
    </div>
  );
}
