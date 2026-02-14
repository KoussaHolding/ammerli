'use client';

import { use, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import { Request, RequestStatus } from '@/types/api';
import { Droplets, MapPin, Truck, Phone, CheckCircle2, Navigation, ArrowLeft, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuthStore();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [step, setStep] = useState(1);

  useEffect(() => {
    // Mocking order data fetching
    setTimeout(() => {
      setOrder({
        id,
        status: RequestStatus.ACCEPTED,
        quantity: 10,
        pickupLat: 36.7372,
        pickupLng: 3.0875,
        driver: {
          firstName: 'Robert',
          lastName: 'Smith',
          phone: '+213 661 22 33 44',
          vehicle: 'White Truck (ABC-123)',
        },
        client: {
          firstName: 'John',
          lastName: 'Doe',
        }
      });
    }, 1000);

    // Simulate progress for demonstration
    const timer = setInterval(() => {
        setStep(prev => prev < 4 ? prev + 1 : prev);
    }, 10000);

    return () => clearInterval(timer);
  }, [id]);

  if (!order) return (
     <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50">
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Locating Order...</p>
     </div>
  );

  const steps = [
    { title: 'Confirmed', desc: 'Order received', icon: CheckCircle2 },
    { title: 'Accepted', desc: 'Driver is on the way', icon: Truck },
    { title: 'Arrived', desc: 'Driver at pickup location', icon: MapPin },
    { title: 'Delivered', desc: 'Water delivered successfully', icon: Droplets },
  ];

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <Link href={user?.role === 'DRIVER' ? '/driver/dashboard' : '/dashboard'} className="flex items-center gap-2 text-zinc-500 hover:text-black transition">
          <ArrowLeft className="h-5 w-5" />
          <span className="font-bold text-sm">Back</span>
        </Link>
        <div className="text-center">
           <h1 className="font-black tracking-tighter">ORDER #{id.slice(0, 8).toUpperCase()}</h1>
        </div>
        <div className="w-12" />
      </header>

      <main className="container mx-auto px-6 pt-8 pb-20">
        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Status Timeline */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm">
               <h3 className="text-xl font-bold mb-8">Delivery Status</h3>
               <div className="space-y-10 relative">
                  <div className="absolute left-6 top-2 bottom-2 w-0.5 bg-zinc-100" />
                  {steps.map((s, i) => {
                     const isDone = step > i;
                     const isCurrent = step === i + 1;
                     return (
                        <div key={i} className="flex gap-6 relative z-10">
                           <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition shadow-lg ${
                              isDone ? 'bg-blue-600 text-white shadow-blue-200' : isCurrent ? 'bg-white border-2 border-blue-600 text-blue-600 shadow-blue-100' : 'bg-white border border-zinc-100 text-zinc-300'
                           }`}>
                              <s.icon className="h-6 w-6" />
                           </div>
                           <div className="flex flex-col justify-center">
                              <h4 className={`font-bold transition ${isDone || isCurrent ? 'text-black' : 'text-zinc-300'}`}>{s.title}</h4>
                              <p className="text-xs text-zinc-400">{s.desc}</p>
                           </div>
                        </div>
                     )
                  })}
               </div>
            </div>

            {/* Entity Info Card (Driver for Client, Client for Driver) */}
            <div className="bg-black text-white p-8 rounded-[2.5rem] shadow-2xl">
               <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-6">{user?.role === 'DRIVER' ? 'Customer' : 'Driver'} Details</h3>
               <div className="flex items-center gap-6 mb-8">
                  <div className="h-20 w-20 bg-zinc-800 rounded-3xl overflow-hidden">
                     <div className="h-full w-full flex items-center justify-center text-3xl font-black text-zinc-700">
                        {user?.role === 'DRIVER' ? order.client.firstName[0] : order.driver.firstName[0]}
                     </div>
                  </div>
                  <div>
                     <p className="text-2xl font-black">{user?.role === 'DRIVER' ? `${order.client.firstName} ${order.client.lastName}` : `${order.driver.firstName} ${order.driver.lastName}`}</p>
                     <p className="text-blue-500 text-sm font-bold">{user?.role !== 'DRIVER' && order.driver.vehicle}</p>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <a href={`tel:${order.driver.phone}`} className="py-4 bg-zinc-800 rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-700 transition">
                     <Phone className="h-5 w-5" />
                     <span className="font-bold text-sm">Call</span>
                  </a>
                  <button className="py-4 bg-blue-600 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-900/50">
                     <Navigation className="h-5 w-5" />
                     <span className="font-bold text-sm">Chat</span>
                  </button>
               </div>
            </div>
          </div>

          {/* Map View */}
          <div className="lg:col-span-8">
             <div className="h-[600px] bg-white rounded-[3rem] border border-zinc-100 shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-50/30 flex items-center justify-center">
                   {/* Simplified Map Simulation */}
                   <div className="relative w-full h-full p-20">
                      {/* Grid Lines */}
                      <div className="absolute inset-0 scale-150 rotate-12 opacity-10" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                      
                      {/* Driver Path */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none">
                         <motion.path 
                           d="M 200 400 Q 400 300 600 200" 
                           fill="none" 
                           stroke="rgba(37, 99, 235, 0.2)" 
                           strokeWidth="8" 
                           strokeLinecap="round" 
                           strokeDasharray="16 16"
                         />
                      </svg>

                      {/* Destinations */}
                      <motion.div 
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="absolute bottom-1/4 left-1/4 h-12 w-12 bg-white rounded-2xl shadow-2xl flex items-center justify-center z-10"
                      >
                         <MapPin className="text-red-500 h-6 w-6" />
                      </motion.div>

                      <motion.div 
                         animate={{ x: [0, 50, 100, 150, 200], y: [0, -20, -40, -60, -80] }}
                         transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                         className="absolute top-1/2 left-1/2 h-16 w-16 bg-blue-600 rounded-2xl shadow-2xl flex items-center justify-center z-20 border-4 border-white"
                      >
                         <Truck className="text-white h-8 w-8" />
                      </motion.div>
                   </div>
                </div>

                <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end pointer-events-none">
                   <div className="bg-black/90 backdrop-blur-md text-white p-6 rounded-3xl pointer-events-auto border border-white/10">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Estimated Arrival</p>
                      <p className="text-3xl font-black tracking-tighter">8 Minutes</p>
                   </div>
                   <div className="flex gap-2 pointer-events-auto">
                      <button className="h-12 w-12 bg-white rounded-2xl shadow-xl flex items-center justify-center hover:bg-zinc-50 transition border border-zinc-100">
                         <Navigation className="h-5 w-5 text-zinc-600" />
                      </button>
                      <button className="h-12 w-12 bg-white rounded-2xl shadow-xl flex items-center justify-center hover:bg-zinc-50 transition border border-zinc-100">
                         <MapPin className="h-5 w-5 text-zinc-600" />
                      </button>
                   </div>
                </div>
             </div>
          </div>

        </div>
      </main>
    </div>
  );
}
