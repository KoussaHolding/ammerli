import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/useAuthStore';

export const useTracking = () => {
  const { user, accessToken } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    if (!user || user.role !== 'DRIVER' || !accessToken) return;

    const socket = io(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/tracking`, {
      query: { driverId: user.id },
      auth: { token: accessToken },
    });

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to tracking namespace');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('new_alert', (payload) => {
      setAlerts((prev) => [...prev, payload]);
    });

    socketRef.current = socket;

    // Simulate location updates every 5 seconds
    const interval = setInterval(() => {
      if (socket.connected) {
        // Mocked location jitter
        const lat = 36.7372 + (Math.random() - 0.5) * 0.01;
        const lng = 3.0875 + (Math.random() - 0.5) * 0.01;
        socket.emit('update_location', { lat, lng });
      }
    }, 5000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, [user, accessToken]);

  const clearAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  return { isConnected, alerts, clearAlert };
};
