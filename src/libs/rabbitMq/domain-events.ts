export enum RabbitMqExchange {
  REQUESTS = 'requests',
  TRACKING = 'tracking',
  NOTIFICATIONS = 'notifications', // For push notifications
  DLQ = 'dlq', // Dead Letter Exchange
}

export enum RabbitMqRoutingKey {
  // Request Lifecycle
  REQUEST_CREATED = 'request.created',
  REQUEST_ACCEPTED = 'request.accepted',
  REQUEST_DISPATCHED = 'request.dispatched', // Matched with drivers
  REQUEST_CANCELLED = 'request.cancelled',
  
  // Ride Lifecycle
  DRIVER_ARRIVED = 'ride.driver_arrived',
  RIDE_STARTED = 'ride.started',
  RIDE_COMPLETED = 'ride.completed',

  // Tracking
  LOCATION_UPDATE = 'tracking.location_update',
}

export interface DomainEvent<T = unknown> {
  id: string;
  occurredAt: Date;
  data: T;
  meta?: Record<string, any>;
}

// Payload Interfaces
export interface RequestCreatedPayload {
  requestId: string;
  userId: string;
  pickup: { lat: number; lng: number };
  dropoff?: { lat: number; lng: number };
  type: string;
}

export interface RequestAcceptedPayload {
  requestId: string;
  driverId: string;
  acceptedAt: Date;
}

export interface DriverArrivedPayload {
  requestId: string;
  driverId: string;
  arrivedAt: Date;
}

export interface RideStartedPayload {
  rideId: string;
  startedAt: Date;
}
