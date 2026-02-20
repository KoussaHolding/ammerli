'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in Next.js
const fixLeafletIcon = () => {
  // @ts-expect-error - Leaflet prototype fix
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
};

interface MapProps {
  center: [number, number];
  zoom?: number;
  markers?: Array<{
    position: [number, number];
    popup?: string;
    icon?: L.Icon;
  }>;
  drivers?: Array<{
    id: string;
    position: [number, number];
    rotation?: number;
  }>;
  onLocationSelect?: (lat: number, lng: number) => void;
  onCameraChange?: (lat: number, lng: number) => void;
  className?: string;
}


function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

function MapEvents({ onCameraChange }: { onCameraChange?: (lat: number, lng: number) => void }) {
  const map = useMapEvents({
    moveend: () => {
      if (onCameraChange) {
        const center = map.getCenter();
        onCameraChange(center.lat, center.lng);
      }
    },
  });
  return null;
}

// Car Icon
const carIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3097/3097136.png', // Temporary car icon
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

function LocationMarker({ onLocationSelect }: { onLocationSelect?: (lat: number, lng: number) => void }) {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  
  useMapEvents({
    click(e) {
      if (onLocationSelect) {
        setPosition(e.latlng);
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });

  return position === null ? null : (
    <Marker position={position}>
      <Popup>Selected Location</Popup>
    </Marker>
  );
}

export default function LeafletMap({ 
  center, 
  zoom = 13, 
  markers = [], 
  drivers = [],
  onLocationSelect, 
  onCameraChange,
  className = "h-full w-full rounded-3xl" 
}: MapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    fixLeafletIcon();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className={`${className} bg-zinc-100 animate-pulse flex items-center justify-center text-zinc-400`}>Loading Map...</div>;
  }

  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} className={className} style={{ zIndex: 0 }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ChangeView center={center} zoom={zoom} />
      <MapEvents onCameraChange={onCameraChange} />
      
      {markers.map((marker, idx) => (
        <Marker key={idx} position={marker.position} icon={marker.icon}>
          {marker.popup && <Popup>{marker.popup}</Popup>}
        </Marker>
      ))}

      {drivers.map((driver) => (
        <Marker key={driver.id} position={driver.position} icon={carIcon} zIndexOffset={100}>
        </Marker>
      ))}

      {/* Only show click marker if onLocationSelect is provided (optional legacy mode) */}
      {onLocationSelect && <LocationMarker onLocationSelect={onLocationSelect} />}
    </MapContainer>
  );
}
