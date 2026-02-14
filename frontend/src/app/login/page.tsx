'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { Droplets, Lock, Phone, Loader2 } from 'lucide-react';
import Link from 'next/link';

const loginSchema = z.object({
  phone: z.string().min(10, 'Invalid phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login(data.phone, data.password);
      setAuth(response.user, response.accessToken, response.refreshToken);
      
      // Redirect based on role
      if (response.user.role === 'ADMIN') router.push('/admin');
      else if (response.user.role === 'DRIVER') router.push('/driver');
      else router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-xl border border-zinc-100"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-200">
            <Droplets className="text-white h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter">Welcome Back</h1>
          <p className="text-zinc-500 mt-2">Log in to your Ammerli account</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold ml-1">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
              <input
                {...register('phone')}
                placeholder="+213 555 555 555"
                className="w-full pl-12 pr-4 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition outline-none"
              />
            </div>
            {errors.phone && <p className="text-xs text-red-500 ml-1">{errors.phone.message}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label className="text-sm font-bold">Password</label>
              <Link href="/forgot" className="text-xs text-blue-600 font-bold">Forgot?</Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
              <input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition outline-none"
              />
            </div>
            {errors.password && <p className="text-xs text-red-500 ml-1">{errors.password.message}</p>}
          </div>

          <button
            disabled={isLoading}
            type="submit"
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-lg shadow-blue-100 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Log In'}
          </button>
        </form>

        <p className="text-center mt-8 text-zinc-500 text-sm">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-blue-600 font-black">Sign Up</Link>
        </p>
      </motion.div>
    </div>
  );
}
