export type UserRole = 'CLIENT' | 'DRIVER' | 'ADMIN';

export interface User {
  id: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  image?: string;
  bio?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  capacityLiters: number;
  basePrice: number;
  pricePerKm: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum RequestStatus {
  SEARCHING = 'SEARCHING',
  DISPATCHED = 'DISPATCHED',
  ACCEPTED = 'ACCEPTED',
  ARRIVED = 'ARRIVED',
  PICKED_UP = 'PICKED_UP',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum RequestType {
  IMMEDIATE = 'IMMEDIATE',
  SCHEDULED = 'SCHEDULED',
}

export interface Request {
  id: string;
  pickupLat: number;
  pickupLng: number;
  quantity: number;
  status: RequestStatus;
  type: RequestType;
  user: User;
  driverId: string | null;
}
