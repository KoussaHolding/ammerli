import { create } from 'zustand';
import { socketService } from '@/services/socket.service';

interface SocketState {
  isConnected: boolean;
  connect: (token: string) => void;
  disconnect: () => void;
}

export const useSocketStore = create<SocketState>((set) => ({
  isConnected: false,
  connect: (token: string) => {
    socketService.connect(token);
    set({ isConnected: true });
  },
  disconnect: () => {
    socketService.disconnect();
    set({ isConnected: false });
  },
}));
