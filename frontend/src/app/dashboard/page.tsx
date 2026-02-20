'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import { useSocketStore } from '@/store/useSocketStore';
import { socketService } from '@/services/socket.service';
import { productService } from '@/services/product.service';
import { requestService } from '@/services/request.service';
import { Product, RequestStatus, Request, RequestType } from '@/types/api';
import { driverService } from '@/services/driver.service';
import { Package, Loader2, LogOut, MapPin, Navigation, ArrowRight, Locate } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamically import Map to avoid SSR issues
const Map = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-zinc-900 animate-pulse flex items-center justify-center text-zinc-500">Loading Map...</div>
});

const PRODUCT_IMAGES: Record<string, string> = {
  'Pack 6x1.5L (Drinkable)': 'https://cdn-icons-png.flaticon.com/512/3050/3050115.png',
  '5L Jug (Drinkable)': 'https://cdn-icons-png.flaticon.com/512/4873/4873979.png',
  'Water Truck (1000L)': 'https://cdn-icons-png.flaticon.com/512/619/619034.png',
  'Large Cistern (3000L)': 'https://cdn-icons-png.flaticon.com/512/2830/2830305.png',
};

const DEFAULT_IMAGE = 'https://cdn-icons-png.flaticon.com/512/824/824239.png';

function ProductCard({ product, onClick }: { product: Product, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="flex items-center gap-4 p-4 bg-black rounded-2xl border border-zinc-800 cursor-pointer hover:border-zinc-600 transition active:scale-[0.98] group"
    >
       <div className="h-16 w-16 bg-zinc-900 rounded-xl flex items-center justify-center shadow-sm shrink-0 p-2">
          <img 
            src={PRODUCT_IMAGES[product.name] || DEFAULT_IMAGE} 
            alt={product.name}
            className="w-full h-full object-contain filter invert" 
          />
       </div>
       <div className="flex-1">
          <h3 className="font-bold text-sm text-white group-hover:text-blue-400 transition">{product.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 font-bold border border-zinc-700">{product.capacityLiters}L</span>
          </div>
       </div>
       <div className="text-right">
          <span className="font-black text-lg block text-white">{product.basePrice} <span className="text-xs text-zinc-500">DA</span></span>
          <ArrowRight className="h-4 w-4 text-zinc-600 group-hover:text-white ml-auto mt-1 transition" />
       </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, logout, accessToken } = useAuthStore();
  const { connect, disconnect } = useSocketStore();
  const router = useRouter();
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isOrdering, setIsOrdering] = useState(false);
  const [activeOrder, setActiveOrder] = useState<Request | null>(null);
  
  // Center of the map (initially Algiers)
  const [mapCenter, setMapCenter] = useState<[number, number]>([36.7372, 3.0875]);
  const [isLocating, setIsLocating] = useState(false);
  
  // Nearby drivers (React Query)
  const { data: nearbyDriversRaw } = useQuery({
    queryKey: ['nearby-drivers', mapCenter],
    queryFn: () => driverService.getNearby(mapCenter[0], mapCenter[1]),
    refetchInterval: 5000, 
    enabled: !!mapCenter && !activeOrder, 
  });

  const nearbyDrivers = useMemo(() => {
    if (!nearbyDriversRaw) return [];
    return nearbyDriversRaw; 
  }, [nearbyDriversRaw]);

  // Get User Location on Mount
  useEffect(() => {
    if (navigator.geolocation && !activeOrder) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter([position.coords.latitude, position.coords.longitude]);
          setIsLocating(false);
        },
        (error) => {
          console.error("Error getting location", error);
          setIsLocating(false);
           // Show error to user
           alert("Could not get your location. Please enable GPS permissions.");
        }
      );
    }
  }, [activeOrder]);

  // Fetch products
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: productService.getAll,
  });

  // Calculate price
  const estimatedPrice = useMemo(() => {
    if (!selectedProduct) return 0;
    return selectedProduct.basePrice * quantity;
  }, [selectedProduct, quantity]);

  // Initial Data Fetch & Socket Connection
  useEffect(() => {
    if (!accessToken) {
      router.push('/login');
      return;
    }

    connect(accessToken);
    
    // Fetch active order
    requestService.getActive().then((order) => {
      if (order) setActiveOrder(order);
    }).catch(() => {
      // No active order or error
    });

    return () => {
      disconnect();
    };
  }, [accessToken, router, connect, disconnect]);

  // Socket Event Listeners
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socketService.on('request_accepted', (data: any) => {
      console.log('Request Accepted:', data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setActiveOrder((prev: any) => ({ ...prev, status: RequestStatus.ACCEPTED, ...data }));
    });

    socketService.on('driver_arrived', () => {
      setActiveOrder((prev) => prev ? { ...prev, status: RequestStatus.ARRIVED } : null);
    });

    socketService.on('request_completed', () => {
       setActiveOrder((prev) => prev ? { ...prev, status: RequestStatus.COMPLETED } : null);
    });

    socketService.on('request_cancelled', () => {
        setActiveOrder((prev) => prev ? { ...prev, status: RequestStatus.CANCELLED } : null);
        alert('Your request has been cancelled.');
        setTimeout(() => setActiveOrder(null), 2000);
    });

    return () => {
      socketService.off('request_accepted');
      socketService.off('driver_arrived');
      socketService.off('request_completed');
      socketService.off('request_cancelled');
    };
  }, []);

  const handleOrder = async () => {
    if (!selectedProduct) return;
    
    setIsOrdering(true);
    try {
      const order = await requestService.create({
        pickupLat: mapCenter[0],
        pickupLng: mapCenter[1],
        quantity,
        type: selectedProduct.capacityLiters >= 100 ? RequestType.BYTRUCK : RequestType.BYLITER,
        productId: selectedProduct.id,
      });
      setActiveOrder(order);
      setSelectedProduct(null); // Close modal
    } catch (err) {
      console.error('Order failed', err);
      alert('Failed to place order. Please try again.');
    } finally {
      setIsOrdering(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const centerMapOnUser = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMapCenter([position.coords.latitude, position.coords.longitude]);
        setIsLocating(false);
      },
      () => setIsLocating(false)
    );
  };

  if (!user) return null;

  return (
    <div className="h-screen w-full bg-black flex flex-col relative overflow-hidden text-white">
      {/* Map Background */}
      <div className="absolute inset-0 z-0">
        <Map 
          center={mapCenter} 
          zoom={15} 
          onCameraChange={(lat, lng) => setMapCenter([lat, lng])}
          drivers={nearbyDrivers}
          className="h-full w-full opacity-80" // Darken map slightly
        />
        
        {/* Center Pin Overlay */}
        {!activeOrder && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 pb-8">
            <div className="relative">
              <MapPin className="h-10 w-10 text-white fill-black drop-shadow-xl animate-bounce" />
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1.5 bg-black/50 rounded-full blur-sm" />
            </div>
          </div>
        )}
      </div>

      {/* Floating Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-6 pointer-events-none">
        <div className="max-w-7xl mx-auto flex justify-between items-start">
           <div className="bg-black/80 backdrop-blur-md px-6 py-3 rounded-full shadow-lg pointer-events-auto flex items-center gap-3 border border-zinc-800">
             <div className="h-9 w-9 bg-white rounded-full flex items-center justify-center text-black font-bold text-sm">
               {user.firstName ? user.firstName[0] : 'U'}
             </div>
             <div>
               <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Hi</p>
               <p className="text-sm font-bold text-white leading-none">{user.firstName || 'User'}</p>
             </div>
           </div>

           <div className="flex gap-3">
             <button 
               onClick={centerMapOnUser}
               className="bg-black/80 backdrop-blur-md h-12 w-12 rounded-full shadow-lg pointer-events-auto flex items-center justify-center hover:bg-zinc-800 transition text-white border border-zinc-800"
             >
               {isLocating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Locate className="h-5 w-5" />}
             </button>
             
             {activeOrder && (
                <div className="bg-blue-600/90 backdrop-blur-md px-4 py-3 rounded-full shadow-lg text-white font-bold flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>On Delivery</span>
                </div>
             )}
             <button 
               onClick={handleLogout}
               className="bg-black/80 backdrop-blur-md h-12 w-12 rounded-full shadow-lg pointer-events-auto flex items-center justify-center hover:bg-red-900/50 hover:text-red-500 transition border border-zinc-800"
             >
               <LogOut className="h-5 w-5" />
             </button>
           </div>
        </div>
      </div>

      {/* Bottom Action Sheet */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto p-4">
          <AnimatePresence mode="wait">
            {activeOrder ? (
               // Active Order View
               <motion.div 
                 initial={{ y: "100%", opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 exit={{ y: "100%", opacity: 0 }}
                 className="bg-zinc-900 rounded-3xl shadow-2xl p-6 border border-zinc-800"
               >
                 <div className="w-12 h-1 bg-zinc-700 rounded-full mx-auto mb-6" />
                 
                 <div className="flex items-center justify-between mb-8">
                   <div>
                     <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">Status</p>
                     <h3 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                       {activeOrder.status === 'SEARCHING' ? 'Finding Driver...' : activeOrder.status}
                     </h3>
                   </div>
                   <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center text-black">
                     {activeOrder.status === 'SEARCHING' ? <Loader2 className="h-7 w-7 animate-spin" /> : <Navigation className="h-7 w-7" />}
                   </div>
                 </div>

                 {activeOrder.status === RequestStatus.ACCEPTED && (
                    <div className="bg-zinc-800 p-4 rounded-2xl border border-zinc-700 mb-6 flex gap-4 items-center">
                      <div className="h-12 w-12 bg-blue-900/50 rounded-full flex items-center justify-center font-bold text-blue-400">D</div>
                      <div>
                        <p className="font-bold text-sm text-white">Driver Assigned</p>
                        <p className="text-xs text-zinc-400">Arriving in 5 mins</p>
                      </div>
                    </div>
                 )}
                 
                 <div className="grid grid-cols-2 gap-3">
                   <button className="py-3 bg-zinc-800 rounded-xl font-bold text-zinc-300 text-sm hover:bg-zinc-700 transition">Contact Support</button>
                   <button 
                     onClick={() => setActiveOrder(null)} // Should ideally not just clear state but minimize
                     className="py-3 bg-zinc-800 rounded-xl font-bold text-zinc-300 text-sm hover:bg-zinc-700 transition"
                   >
                     Hide Map
                   </button>
                 </div>
               </motion.div>
            ) : selectedProduct ? (
               // Confirm Order View
               <motion.div 
                 initial={{ y: "100%", opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 exit={{ y: "100%", opacity: 0 }}
                 className="bg-zinc-900 rounded-[2rem] shadow-2xl p-6 pb-8 border border-zinc-800"
               >
                 <div className="w-12 h-1 bg-zinc-700 rounded-full mx-auto mb-6" />
                 
                 <div className="flex gap-5 mb-8">
                   <div className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center shrink-0 p-2 border border-zinc-800">
                      <img 
                        src={PRODUCT_IMAGES[selectedProduct.name] || DEFAULT_IMAGE} 
                        alt={selectedProduct.name}
                        className="w-full h-full object-contain filter invert" 
                      />
                   </div>
                   <div>
                      <h3 className="text-xl font-black tracking-tight leading-tight mb-1">{selectedProduct.name}</h3>
                      <p className="text-zinc-400 text-xs leading-relaxed line-clamp-2">{selectedProduct.description}</p>
                   </div>
                 </div>

                 <div className="flex items-center justify-between mb-8 bg-black p-3 rounded-2xl border border-zinc-800">
                    <div className="flex items-center gap-3">
                       <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="h-10 w-10 bg-zinc-900 shadow-sm border border-zinc-700 rounded-xl font-bold flex items-center justify-center hover:bg-zinc-800 transition text-white">-</button>
                       <span className="text-xl font-black w-6 text-center">{quantity}</span>
                       <button onClick={() => setQuantity(quantity + 1)} className="h-10 w-10 bg-white text-black shadow-sm rounded-xl font-bold flex items-center justify-center hover:bg-zinc-200 transition">+</button>
                    </div>
                    <div className="text-right px-2">
                       <p className="text-[10px] text-zinc-400 font-bold uppercase">Total</p>
                       <p className="text-2xl font-black tracking-tight text-white">{estimatedPrice} <span className="text-sm font-bold text-zinc-500">DA</span></p>
                    </div>
                 </div>

                 <div className="grid grid-cols-[1fr,2fr] gap-3">
                   <button 
                     onClick={() => setSelectedProduct(null)}
                     className="py-4 bg-zinc-800 rounded-xl font-bold text-zinc-400 hover:bg-zinc-700 transition text-sm"
                   >
                     Cancel
                   </button>
                   <button 
                     onClick={handleOrder}
                     disabled={isOrdering}
                     className="py-4 bg-white text-black rounded-xl font-bold hover:bg-zinc-200 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-white/10"
                   >
                     {isOrdering ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                       <>
                         Confirm Pickup
                         <ArrowRight className="h-4 w-4" />
                       </>
                     )}
                   </button>
                 </div>
               </motion.div>
            ) : (
               // Product Selection View (Uber style list)
               <motion.div 
                 initial={{ y: 20, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 className="bg-zinc-900 rounded-[2rem] shadow-2xl p-6 pb-8 border border-zinc-800"
               >
                 <div className="w-12 h-1 bg-zinc-700 rounded-full mx-auto mb-6" />
                 
                 <h2 className="text-xl font-black tracking-tight mb-4 px-1 text-white">Choose Service</h2>
                 
                 <div className="flex flex-col gap-6 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
                   {productsLoading ? (
                      <div className="w-full flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-zinc-500" /></div>
                   ) : (
                     <>
                       {/* Drinkable Section */}
                       <div>
                         <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 px-1">Drinkable Water</h3>
                         <div className="flex flex-col gap-3">
                           {products?.filter(p => p.capacityLiters < 100).map(product => (
                              <ProductCard key={product.id} product={product} onClick={() => setSelectedProduct(product)} />
                           ))}
                         </div>
                       </div>

                       {/* Truck Section */}
                       <div>
                         <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 px-1">Tank Delivery</h3>
                         <div className="flex flex-col gap-3">
                           {products?.filter(p => p.capacityLiters >= 100).map(product => (
                              <ProductCard key={product.id} product={product} onClick={() => setSelectedProduct(product)} />
                           ))}
                         </div>
                       </div>
                     </>
                   )}
                 </div>
               </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
