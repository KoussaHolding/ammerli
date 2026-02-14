'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import { productService } from '@/services/product.service';
import { requestService } from '@/services/request.service';
import { Product, RequestStatus } from '@/types/api';
import { Droplets, MapPin, Navigation, Package, Check, Loader2, LogOut } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isOrdering, setIsOrdering] = useState(false);
  const [activeOrder, setActiveOrder] = useState<any>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: productService.getAll,
  });

  useEffect(() => {
    if (!user) router.push('/login');
  }, [user, router]);

  const handleOrder = async () => {
    if (!selectedProduct) return;
    setIsOrdering(true);
    try {
      // Mocked location for now, but we'd use Leaflet/Google Maps here
      const request = await requestService.create({
        pickupLat: 36.7372,
        pickupLng: 3.0875,
        quantity,
        type: 'IMMEDIATE',
      });
      setActiveOrder(request);
    } catch (err) {
      console.error('Order failed', err);
    } finally {
      setIsOrdering(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 sticky top-0 z-40">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Droplets className="text-blue-600 h-6 w-6" />
            <span className="text-xl font-bold tracking-tighter">Ammerli</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-zinc-500 uppercase tracking-widest">{user.role}</p>
            </div>
            <button 
              onClick={() => { logout(); router.push('/'); }}
              className="p-2 hover:bg-zinc-100 rounded-full text-zinc-400 transition"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 pt-8">
        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Main Flow */}
          <div className="lg:col-span-8 space-y-8">
            <section>
              <h2 className="text-2xl font-black tracking-tight mb-6">Select Product</h2>
              {isLoading ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-white rounded-3xl animate-pulse" />)}
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {products?.map((product) => (
                    <motion.button
                      key={product.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedProduct(product)}
                      className={`p-6 rounded-[2rem] border-2 text-left transition relative overflow-hidden bg-white ${
                        selectedProduct?.id === product.id ? 'border-blue-600 shadow-lg shadow-blue-50' : 'border-zinc-100 hover:border-zinc-200'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-2xl ${selectedProduct?.id === product.id ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'}`}>
                          <Package className="h-6 w-6" />
                        </div>
                        {selectedProduct?.id === product.id && (
                          <div className="bg-blue-600 text-white rounded-full p-1">
                            <Check className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <h3 className="font-bold text-lg">{product.name}</h3>
                      <p className="text-sm text-zinc-500 mb-4">{product.capacityLiters}L • Premium Filtered</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black">${product.basePrice}</span>
                        <span className="text-xs text-zinc-400 font-bold uppercase">per unit</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-zinc-100 rounded-2xl">
                  <MapPin className="h-6 w-6 text-zinc-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Pickup Location</h3>
                  <p className="text-sm text-zinc-500">Your current location is set as default</p>
                </div>
              </div>
              <div className="h-64 bg-zinc-100 rounded-3xl flex items-center justify-center relative group cursor-crosshair">
                 <Navigation className="h-8 w-8 text-blue-600 animate-pulse" />
                 <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition rounded-3xl flex items-center justify-center">
                    <span className="bg-white px-4 py-2 rounded-full text-xs font-bold shadow-lg">Change on Map</span>
                 </div>
              </div>
            </section>
          </div>

          {/* Sidebar / Checkout */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              <div className="bg-black text-white p-8 rounded-[2.5rem] shadow-2xl">
                <h3 className="text-xl font-bold mb-6">Order Summary</h3>
                
                {!selectedProduct ? (
                  <p className="text-zinc-400 text-sm">Please select a product to continue.</p>
                ) : (
                  <div className="space-y-6">
                     <div className="flex justify-between items-center">
                        <span className="text-zinc-400">{selectedProduct.name}</span>
                        <div className="flex items-center gap-3 bg-zinc-800 px-3 py-1 rounded-full">
                           <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="hover:text-blue-400">-</button>
                           <span className="font-bold w-4 text-center">{quantity}</span>
                           <button onClick={() => setQuantity(quantity + 1)} className="hover:text-blue-400">+</button>
                        </div>
                     </div>
                     <div className="h-px bg-zinc-800 w-full" />
                     <div className="flex justify-between items-center text-2xl font-black">
                        <span>Total</span>
                        <span>${(selectedProduct.basePrice * quantity).toFixed(2)}</span>
                     </div>
                     <button
                        disabled={isOrdering}
                        onClick={handleOrder}
                        className="w-full py-5 bg-blue-600 rounded-2xl font-black hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50 mt-4 shadow-xl shadow-blue-900/20"
                     >
                        {isOrdering ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Confirm Order'}
                     </button>
                  </div>
                )}
              </div>

              {/* Status Tracking Card */}
              <AnimatePresence>
                {activeOrder && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-600 text-white p-8 rounded-[2.5rem] shadow-xl"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <h4 className="font-bold">Active Delivery</h4>
                      <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">Searching...</span>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                         <div className="h-2 w-2 rounded-full bg-white mt-1.5 animate-ping" />
                         <p className="text-sm leading-relaxed">Assigning nearest driver for your {activeOrder.quantity} units...</p>
                      </div>
                      <Link href={`/order/${activeOrder.id}`} className="block w-full text-center py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition">
                        Full Tracking View
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
