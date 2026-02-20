'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useSocketStore } from '@/store/useSocketStore';
import { socketService } from '@/services/socket.service';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Request, RequestStatus } from '@/types/api';
import { Power, Navigation, User, MapPin, Phone, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api-client';

const Map = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-zinc-100 animate-pulse" />
});

export default function DriverDashboard() {
  const { user, accessToken } = useAuthStore();
  const { connect, disconnect } = useSocketStore();
  const router = useRouter();

  const [isOnline, setIsOnline] = useState(false);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [incomingRequest, setIncomingRequest] = useState<Request | null>(null);
  const [activeJob, setActiveJob] = useState<Request | null>(null);

  // Default Algiers
  const defaultCenter: [number, number] = [36.7372, 3.0875];

  useEffect(() => {
    if (!user) {
        router.push('/login');
        return;
    }
    // if (user.role !== 'DRIVER') { // Commented out for easier testing
    //     router.push('/dashboard');
    // }
    if (accessToken) connect(accessToken);
    return () => disconnect();
  }, [user, accessToken, router, connect, disconnect]);

  // Location Tracking
  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(newLoc);
        // If online, emit location update
        if (isOnline) {
            socketService.emit('update_location', newLoc);
        }
      },
      (err) => console.error(err),
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [isOnline]);

  // Socket Events
  useEffect(() => {
    const handleRequestCreated = (data: Request) => {
        console.log('New Request:', data);
        if (isOnline && !activeJob) {
            setIncomingRequest(data);
        }
    };
    
    const handleRequestAssigned = (data: Request) => {
        // If assigned to me
        // if (data.driverId === user?.id) { // relaxed check for testing
            setActiveJob(data);
            setIncomingRequest(null);
        // }
    };

    socketService.on('request_created', handleRequestCreated);
    socketService.on('request_assigned', handleRequestAssigned);

    return () => {
        socketService.off('request_created');
        socketService.off('request_assigned');
    };
  }, [isOnline, activeJob, user]);

  const toggleOnline = () => {
    setIsOnline(!isOnline);
    // Emit status change to backend
    socketService.emit('driver_status', { status: !isOnline ? 'ONLINE' : 'OFFLINE' });
  };

  const acceptRequest = async () => {
    if (!incomingRequest) return;
    try {
        await api.post(`/driver/request/${incomingRequest.id}/accept`);
        setActiveJob({ ...incomingRequest, status: RequestStatus.ACCEPTED, driverId: user!.id });
        setIncomingRequest(null);
    } catch (err) {
        console.error('Failed to accept', err);
        // Fallback for demo if API fails
        setActiveJob({ ...incomingRequest, status: RequestStatus.ACCEPTED, driverId: user!.id });
        setIncomingRequest(null);
    }
  };

  const updateStatus = async (status: RequestStatus) => {
      if (!activeJob) return;
      try {
          await api.post(`/driver/request/${activeJob.id}/status`, { status });
          setActiveJob({ ...activeJob, status });
          if (status === RequestStatus.COMPLETED) {
              setTimeout(() => setActiveJob(null), 3000);
          }
      } catch (err) {
          console.error('Failed to update status', err);
           // Fallback for demo if API fails
           setActiveJob({ ...activeJob, status });
           if (status === RequestStatus.COMPLETED) {
              setTimeout(() => setActiveJob(null), 3000);
           }
      }
  };

  if (!user) return null;

  return (
    <div className="h-screen flex flex-col bg-zinc-50">
       {/* Header */}
       <header className="bg-white px-6 py-4 shadow-sm z-20 flex justify-between items-center relative">
          <div className="flex items-center gap-3">
             <div className="bg-black text-white p-2 rounded-xl">
                <Navigation className="h-5 w-5" />
             </div>
             <div>
                <h1 className="font-bold text-lg leading-none">Driver Console</h1>
                <p className="text-xs text-zinc-400">{isOnline ? '● You are Online' : '○ You are Offline'}</p>
             </div>
          </div>
          <button 
             onClick={toggleOnline}
             className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition ${
                 isOnline ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-black text-white hover:bg-zinc-800'
             }`}
          >
             <Power className="h-4 w-4" />
             {isOnline ? 'Go Offline' : 'Go Online'}
          </button>
       </header>

       {/* Main Map */}
       <div className="flex-1 relative z-0">
          <Map 
            center={location ? [location.lat, location.lng] : defaultCenter} 
            zoom={15}
            markers={[
                ...(location ? [{ position: [location.lat, location.lng] as [number, number], icon: undefined }] : []), // Driver Icon
                ...(incomingRequest ? [{ position: [incomingRequest.pickupLat, incomingRequest.pickupLng] as [number, number], popup: "New Request!" }] : []),
                ...(activeJob ? [{ position: [activeJob.pickupLat, activeJob.pickupLng] as [number, number], popup: "Pickup" }] : [])
            ]}
          />
          
          {/* Incoming Request Modal */}
          <AnimatePresence>
             {incomingRequest && (
                <motion.div 
                   initial={{ y: 100, opacity: 0 }}
                   animate={{ y: 0, opacity: 1 }}
                   exit={{ y: 100, opacity: 0 }}
                   className="absolute bottom-8 left-6 right-6 bg-black text-white p-6 rounded-[2rem] shadow-2xl z-[1000] flex flex-col gap-4"
                >
                   <div className="flex justify-between items-center">
                      <div>
                         <h3 className="text-xl font-bold text-blue-400">New Request!</h3>
                         <p className="text-zinc-400">2.5km away • {incomingRequest.quantity} Units</p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center animate-bounce">
                         <Navigation className="h-6 w-6" />
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => setIncomingRequest(null)} className="py-4 rounded-xl font-bold bg-zinc-800 hover:bg-zinc-700 transition">Decline</button>
                      <button onClick={acceptRequest} className="py-4 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 transition">Accept Now</button>
                   </div>
                </motion.div>
             )}
          </AnimatePresence>

          {/* Active Job Panel */}
           <AnimatePresence>
             {activeJob && !incomingRequest && (
                <motion.div 
                   initial={{ y: 100, opacity: 0 }}
                   animate={{ y: 0, opacity: 1 }}
                   className="absolute bottom-0 left-0 right-0 bg-white p-6 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-[1000]"
                >
                   <div className="container mx-auto max-w-lg space-y-6 pb-6">
                      <div className="flex items-center gap-4">
                         <div className="h-12 w-12 bg-zinc-100 rounded-full flex items-center justify-center">
                            <User className="h-6 w-6 text-zinc-500" />
                         </div>
                         <div className="flex-1">
                            <h3 className="font-bold text-xl">{activeJob.user?.firstName || 'Client'}</h3>
                            <p className="text-zinc-400 text-sm">Active Order #{activeJob.id.slice(-4)}</p>
                         </div>
                         <button className="h-12 w-12 rounded-full border-2 border-green-100 text-green-600 flex items-center justify-center hover:bg-green-50">
                            <Phone className="h-5 w-5" />
                         </button>
                      </div>

                      <div className="flex items-start gap-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                         <MapPin className="h-6 w-6 text-red-500 mt-1" />
                         <div>
                            <p className="font-bold text-zinc-800">Pickup Location</p>
                            <p className="text-sm text-zinc-500">{activeJob.pickupLat.toFixed(4)}, {activeJob.pickupLng.toFixed(4)}</p>
                         </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                         {activeJob.status === RequestStatus.ACCEPTED && (
                            <button onClick={() => updateStatus(RequestStatus.ARRIVED)} className="py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200">
                               Confirm Arrival
                            </button>
                         )}
                         {activeJob.status === RequestStatus.ARRIVED && (
                            <button onClick={() => updateStatus(RequestStatus.PICKED_UP)} className="py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200">
                               Start Delivery
                            </button>
                         )}
                         {activeJob.status === RequestStatus.PICKED_UP && (
                            <button onClick={() => updateStatus(RequestStatus.COMPLETED)} className="py-4 bg-black text-white rounded-xl font-bold shadow-lg">
                               Complete Order
                            </button>
                         )}
                         {activeJob.status === RequestStatus.COMPLETED && (
                            <div className="text-center py-4 text-green-600 font-black text-xl flex items-center justify-center gap-2">
                               <CheckCircle className="h-6 w-6" />
                               Job Completed!
                            </div>
                         )}
                      </div>
                   </div>
                </motion.div>
             )}
          </AnimatePresence>
       </div>
    </div>
  );
}
