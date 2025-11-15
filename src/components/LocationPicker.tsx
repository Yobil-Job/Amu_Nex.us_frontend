import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Navigation, Map } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

// Import Leaflet components with error handling
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, useMapEvents, Popup, useMap } from 'react-leaflet';

// Fix for default marker icon in react-leaflet
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;


interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (lat: number, lng: number) => void;
  height?: string;
  editable?: boolean;
  eventTitle?: string;
}

// Component to handle map click events
function MapClickHandler({ onLocationChange, editable }: { onLocationChange: (lat: number, lng: number) => void; editable: boolean }) {
  useMapEvents({
    click: (e) => {
      if (editable) {
        const { lat, lng } = e.latlng;
        onLocationChange(lat, lng);
      }
    },
  });
  return null;
}

// Component to center map on geolocation
function CenterMapOnLocation({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, 16);
    }
  }, [position, map]);
  return null;
}

// Map style options
type MapStyle = 'street' | 'satellite' | 'terrain';

const mapStyles: Record<MapStyle, { name: string; url: string; attribution: string }> = {
  street: {
    name: 'Street Map',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  satellite: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  terrain: {
    name: 'Terrain',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }
};

export const LocationPicker = ({ 
  latitude, 
  longitude, 
  onLocationChange, 
  height = '400px',
  editable = true,
  eventTitle = 'Event Location'
}: LocationPickerProps) => {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [hasTriedGeoLocation, setHasTriedGeoLocation] = useState(false);
  const [mapStyle, setMapStyle] = useState<MapStyle>('street');

  // Get current location using geolocation API
  const getCurrentLocation = useCallback((showErrorToast = false) => {
    setIsLocating(true);
    setHasTriedGeoLocation(true);
    
    if (!navigator.geolocation) {
      setIsLocating(false);
      if (showErrorToast) {
        toast.error('Geolocation is not supported by your browser.');
      }
      return;
    }

    try {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          try {
            const { latitude: lat, longitude: lng } = position.coords;
            const newPosition: [number, number] = [lat, lng];
            setCurrentLocation(newPosition);
            setPosition(newPosition);
            onLocationChange(lat, lng);
            setIsLocating(false);
            toast.success('Current location found!');
          } catch (error) {
            console.error('Error processing geolocation:', error);
            setIsLocating(false);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          setIsLocating(false);
          // Only show error toast if explicitly requested (button click)
          if (showErrorToast) {
            toast.error('Could not get your location. Please click on the map to select location.');
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } catch (error) {
      console.error('Error calling geolocation:', error);
      setIsLocating(false);
    }
  }, [onLocationChange]);

  // Initialize position from props
  useEffect(() => {
    if (latitude && longitude) {
      const newPosition: [number, number] = [latitude, longitude];
      setPosition(newPosition);
      setCurrentLocation(newPosition);
    }
  }, [latitude, longitude]);

  // Set default position if none provided
  useEffect(() => {
    if (!position && !latitude && !longitude) {
      // Default to Arba Minch, Ethiopia if no location provided
      setPosition([6.0292, 37.5917]); // Arba Minch coordinates
    }
  }, [position, latitude, longitude]);

  // Auto-detect location only when dialog opens (editable mode, no existing location)
  useEffect(() => {
    if (editable && !latitude && !longitude && !isLocating && !hasTriedGeoLocation) {
      // Delay to ensure map is mounted
      const timer = setTimeout(() => {
        getCurrentLocation(false); // Don't show error toast on auto-try
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [editable, latitude, longitude, isLocating, hasTriedGeoLocation, getCurrentLocation]);

  const handleLocationSelect = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    onLocationChange(lat, lng);
  };

  // Always ensure we have a valid position
  const mapCenter: [number, number] = position || [6.0292, 37.5917]; // Arba Minch coordinates
  const mapZoom = (latitude && longitude) ? 16 : 13;

  if (!position && !latitude && !longitude) {
    return (
      <div className="w-full bg-muted rounded-lg flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent mb-2"></div>
          <p className="text-muted-foreground text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg overflow-hidden border border-border relative" style={{ height }}>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        key={`map-${mapCenter[0]}-${mapCenter[1]}`}
      >
        <TileLayer
          key={mapStyle}
          attribution={mapStyles[mapStyle].attribution}
          url={mapStyles[mapStyle].url}
        />
        {currentLocation && <CenterMapOnLocation position={currentLocation} />}
        {editable && (
          <MapClickHandler onLocationChange={handleLocationSelect} editable={editable} />
        )}
        {(latitude && longitude) && (
          <Marker position={[latitude, longitude]}>
            <Popup>
              <div className="text-center">
                <p className="font-semibold">{eventTitle}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Lat: {latitude.toFixed(6)}, Lng: {longitude.toFixed(6)}
                </p>
                {editable && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Click map to change location
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
      {editable && (
        <div className="absolute top-2 right-2 z-[1000] flex flex-col gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => getCurrentLocation(true)}
            disabled={isLocating}
            className="gap-2 shadow-md"
          >
            <Navigation className={`h-4 w-4 ${isLocating ? 'animate-spin' : ''}`} />
            {isLocating ? 'Locating...' : 'Use My Location'}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="gap-2 shadow-md"
              >
                <Map className="h-4 w-4" />
                {mapStyles[mapStyle].name}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-card border-primary/20 bg-background/95 backdrop-blur-md">
              {(Object.keys(mapStyles) as MapStyle[]).map((style) => (
                <DropdownMenuItem
                  key={style}
                  onClick={() => setMapStyle(style)}
                  className={`cursor-pointer ${mapStyle === style ? 'bg-primary/20' : ''}`}
                >
                  {mapStyles[style].name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      {editable && (
        <div className="p-2 bg-muted/50 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Click on the map or use "Use My Location" button to select the event location
          </p>
        </div>
      )}
      </div>
  );
};

