import React, { useState, useEffect, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker, useMap, MapMouseEvent } from '@vis.gl/react-google-maps';
import { Input, Card } from 'antd';
import type { InputRef } from 'antd';

interface LocationMapProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialPosition?: { lat: number; lng: number };
  assignedLocation?: { lat: number; lng: number; radius: number; name: string };
}

const LocationMap: React.FC<LocationMapProps> = ({
  onLocationSelect,
  initialPosition = { lat: 17.072036983980418, lng: -96.75978056140424 },
  assignedLocation,
}) => {
  const [center, setCenter] = useState(initialPosition);
  const [markerPosition, setMarkerPosition] = useState(initialPosition);
  const map = useMap();
  const circleRef = useRef<google.maps.Circle | null>(null);
  const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null);
  const inputRef = useRef<InputRef>(null);

  // Obtener la clave de API desde .env
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Validar la clave de API
  if (!apiKey) {
    console.error('Google Maps API key is missing. Please set VITE_GOOGLE_MAPS_API_KEY in your .env file.');
    return <div>Error: Clave de API de Google Maps no configurada</div>;
  }

  // Inicializar el círculo si hay una ubicación asignada
  useEffect(() => {
    if (!map || !assignedLocation || circleRef.current) return;

    circleRef.current = new google.maps.Circle({
      strokeColor: '#1890ff',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#1890ff',
      fillOpacity: 0.2,
      map,
      center: { lat: assignedLocation.lat, lng: assignedLocation.lng },
      radius: assignedLocation.radius,
    });

    return () => {
      if (circleRef.current) {
        circleRef.current.setMap(null);
        circleRef.current = null;
      }
    };
  }, [map, assignedLocation]);

  // Configurar el buscador con autocompletado
  useEffect(() => {
    if (!map || !inputRef.current?.input) return;

    const searchBox = new google.maps.places.SearchBox(inputRef.current.input);
    searchBoxRef.current = searchBox;

    map.controls[google.maps.ControlPosition.TOP_LEFT].push(inputRef.current.input);

    searchBox.addListener('places_changed', () => {
      const places = searchBox.getPlaces();
      if (!places || places.length === 0 || !places[0].geometry?.location) return;

      const place = places[0];
      if (!place.geometry?.location) return;
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();

      setMarkerPosition({ lat, lng });
      setCenter({ lat, lng });
      if (circleRef.current) {
        circleRef.current.setCenter({ lat, lng });
      }
      map.setCenter({ lat, lng });
      map.setZoom(15);
      onLocationSelect(lat, lng);
    });

    return () => {
      if (searchBoxRef.current) {
        google.maps.event.clearInstanceListeners(searchBoxRef.current);
      }
    };
  }, [map, onLocationSelect]);

  // Manejar clics en el mapa
  const handleMapClick = (e: MapMouseEvent) => {
    if (!e.detail.latLng) return;
    const lat = e.detail.latLng.lat;
    const lng = e.detail.latLng.lng;
    setMarkerPosition({ lat, lng });
    setCenter({ lat, lng });
    if (circleRef.current) {
      circleRef.current.setCenter({ lat, lng });
    }
    onLocationSelect(lat, lng);
  };

  return (
    <Card title="Selecciona tu ubicación en el mapa">
      <div style={{ height: '400px', width: '100%', position: 'relative' }}>
        <APIProvider apiKey={apiKey} libraries={['places']}>
          <Input
            ref={inputRef}
            placeholder="Buscar ubicación"
            className="pac-target-input"
            style={{
              width: '320px',
              margin: '10px',
              position: 'absolute',
              top: '10px',
              left: '10px',
              zIndex: 1000,
            }}
          />
          <Map
            mapId="default-map"
            center={center}
            zoom={15}
            onClick={handleMapClick}
            style={{ height: '100%', width: '100%' }}
            defaultZoom={15}
            gestureHandling={'greedy'}
            disableDefaultUI={false}
          >
            <AdvancedMarker position={markerPosition} />
          </Map>
        </APIProvider>
      </div>
    </Card>
  );
};

export default LocationMap;