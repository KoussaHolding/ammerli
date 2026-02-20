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

const registerSchema = z.object({
  firstName: z.string().min(2, 'Name is too short'),
  lastName: z.string().min(2, 'Name is too short'),
  phone: z.string().min(10, 'Invalid phone number'),
  password: z.string().min(6, 'Password too short'),
  role: z.enum(['CLIENT', 'DRIVER']),
  driverType: z.string().optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'CLIENT',
      driverType: 'MOTORCYCLE',
    },
  });

  const selectedRole = watch('role');

  // ... imports

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    setError(null);
    try {
      // Remove driverType if role is CLIENT
      const submissionData = { ...data };
      submissionData.phone = normalizePhone(data.phone);

      if (submissionData.role === 'CLIENT') {
        delete submissionData.driverType;
      }

      const response = await authService.register(submissionData);
      setAuth(response.user, response.accessToken, response.refreshToken);
      
      if (response.user.role === 'DRIVER') router.push('/driver/dashboard');
      else router.push('/dashboard');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err.response?.data?.details) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const messages = err.response.data.details.map((d: any) => d.message).join(', ');
        setError(messages);
      } else {
        setError(err.response?.data?.message || 'Registration failed');
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

      <main className="flex-1 flex flex-col justify-center px-6 max-w-lg mx-auto w-full py-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div>
             <h2 className="text-4xl font-medium mb-2">Sign Up</h2>
             <p className="text-zinc-400">Create your account to get started.</p>
          </div>

          {error && (
            <div className="p-4 bg-red-900/20 text-red-400 border border-red-900/50 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <input
                  {...register('firstName')}
                  placeholder="First Name"
                  className="w-full p-4 bg-zinc-900 border-none rounded-lg text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-white transition outline-none"
                />
                {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-2">
                <input
                  {...register('lastName')}
                  placeholder="Last Name"
                  className="w-full p-4 bg-zinc-900 border-none rounded-lg text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-white transition outline-none"
                />
                {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <input
                {...register('phone')}
                placeholder="Phone Number"
                className="w-full p-4 bg-zinc-900 border-none rounded-lg text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-white transition outline-none"
              />
              {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
            </div>

            <div className="space-y-2">
              <input
                {...register('password')}
                type="password"
                placeholder="Password"
                className="w-full p-4 bg-zinc-900 border-none rounded-lg text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-white transition outline-none"
              />
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400 ml-1">I want to...</label>
              <div className="grid grid-cols-2 gap-4">
                 <label className={`cursor-pointer border-2 rounded-xl p-4 text-center transition ${selectedRole === 'CLIENT' ? 'border-white bg-zinc-800' : 'border-transparent bg-zinc-900 text-zinc-500'}`}>
                    <input type="radio" value="CLIENT" {...register('role')} className="hidden" />
                    <span className="font-bold">Order Water</span>
                 </label>
                 <label className={`cursor-pointer border-2 rounded-xl p-4 text-center transition ${selectedRole === 'DRIVER' ? 'border-white bg-zinc-800' : 'border-transparent bg-zinc-900 text-zinc-500'}`}>
                    <input type="radio" value="DRIVER" {...register('role')} className="hidden" />
                    <span className="font-bold">Drive</span>
                 </label>
              </div>
            </div>

            {selectedRole === 'DRIVER' && (
               <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2 overflow-hidden">
                 <select
                   {...register('driverType')}
                   className="w-full p-4 bg-zinc-900 border-none rounded-lg text-white focus:ring-2 focus:ring-white transition outline-none appearance-none"
                 >
                   <option value="MOTORCYCLE">Motorcycle</option>
                   <option value="CAR">Car</option>
                   <option value="TRUCK">Truck</option>
                 </select>
               </motion.div>
            )}

            <button
              disabled={isLoading}
              type="submit"
              className="w-full py-4 bg-white text-black rounded-lg font-medium text-lg hover:bg-zinc-200 transition flex items-center justify-center gap-2 disabled:opacity-50 mt-8"
            >
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                 <>
                  Sign Up
                  <ArrowRight className="h-5 w-5" />
                 </>
              )}
            </button>
          </form>

          <p className="text-center text-zinc-500 text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-white font-medium hover:underline">Log In</Link>
          </p>
        </motion.div>
      </main>
    </div>
  );
}
