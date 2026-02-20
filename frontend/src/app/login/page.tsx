'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { normalizePhone } from '@/lib/utils';

const loginSchema = z.object({
  phone: z.string().min(10, 'Enter a valid phone number'),
  password: z.string().min(1, 'Password is required'),
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

  // ... imports

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);
    try {
      const formattedPhone = normalizePhone(data.phone);
      const response = await authService.login(formattedPhone, data.password);
      setAuth(response.user, response.accessToken, response.refreshToken);
      
      if (response.user.role === 'ADMIN') router.push('/admin');
      else if (response.user.role === 'DRIVER') router.push('/driver/dashboard');
      else router.push('/dashboard');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err.response?.data?.details) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const messages = err.response.data.details.map((d: any) => d.message).join(', ');
        setError(messages);
      } else {
        setError(err.response?.data?.message || 'Invalid phone number or password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="p-6">
        <h1 className="text-2xl font-normal tracking-tight">Ammerli</h1>
      </header>
      
      <main className="flex-1 flex flex-col justify-center px-6 max-w-lg mx-auto w-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div>
            <h2 className="text-4xl font-medium mb-2">Login</h2>
            <p className="text-zinc-400">Enter your credentials to continue.</p>
          </div>

          {error && (
            <div className="p-4 bg-red-900/20 text-red-400 border border-red-900/50 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <input
                {...register('phone')}
                placeholder="Phone number"
                className="w-full p-4 bg-zinc-900 border-none rounded-lg text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-white transition outline-none text-lg"
              />
              {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
            </div>

            <div className="space-y-2">
              <input
                {...register('password')}
                type="password"
                placeholder="Password"
                className="w-full p-4 bg-zinc-900 border-none rounded-lg text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-white transition outline-none text-lg"
              />
              {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
            </div>

            <button
              disabled={isLoading}
              type="submit"
              className="w-full py-4 bg-white text-black rounded-lg font-medium text-lg hover:bg-zinc-200 transition flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
            >
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                <>
                  Next
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          <div className="flex justify-between items-center text-sm pt-4">
             <Link href="/register" className="text-zinc-400 hover:text-white transition">Don&apos;t have an account?</Link>
             <Link href="/forgot" className="text-zinc-400 hover:text-white transition">Forgot Password?</Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
