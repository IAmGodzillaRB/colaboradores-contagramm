import React, { useEffect, useRef } from 'react';
import { Modal, Card } from 'antd';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { Ubicacion } from '../../types/Ubicacion';

interface LocationMapModalProps {
  open: boolean;
  onClose: () => void;
  ubicacion: Ubicacion | null;
}

const LocationMapModal: React.FC<LocationMapModalProps> = ({ open, onClose, ubicacion }) => {
  const map = useMap();
  const circleRef = useRef<google.maps.Circle | null>(null);

  // Obtener la clave de API desde .env
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Validar la clave de API
  if (!apiKey) {
    console.error('Google Maps API key is missing. Please set VITE_GOOGLE_MAPS_API_KEY in your .env file.');
    return (
      <Modal
        title={<div className="text-xl font-semibold text-blue-800">Error</div>}
        open={open}
        onCancel={onClose}
        footer={
          <button
            type="button"
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
          >
            Cerrar
          </button>
        }
        width={800}
        className="rounded-lg"
        zIndex={1001} // Asegura que el modal del mapa esté por encima
      >
        <div className="text-red-500 p-4">Error: Clave de API de Google Maps no configurada</div>
      </Modal>
    );
  }

  // Centro y marcador por defecto si no hay ubicación
  const defaultCenter = { lat: 17.072036983980418, lng: -96.75978056140424 };
  const center = ubicacion ? { lat: ubicacion.latitud, lng: ubicacion.longitud } : defaultCenter;
  const markerPosition = ubicacion ? { lat: ubicacion.latitud, lng: ubicacion.longitud } : defaultCenter;

  // Inicializar el círculo si hay una ubicación
  useEffect(() => {
    if (!map || !ubicacion || circleRef.current) return;

    circleRef.current = new google.maps.Circle({
      strokeColor: '#1890ff',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#1890ff',
      fillOpacity: 0.35,
      map,
      center: { lat: ubicacion.latitud, lng: ubicacion.longitud },
      radius: ubicacion.radio,
    });

    return () => {
      if (circleRef.current) {
        circleRef.current.setMap(null);
        circleRef.current = null;
      }
    };
  }, [map, ubicacion]);

  return (
    <Modal
      title={
        <div className="text-xl font-semibold text-blue-800">
          {ubicacion ? `Mapa de ${ubicacion.nombre}` : 'Mapa'}
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={
        <button
          type="button"
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-800 text-white font-medium py-2 px-4 rounded-md"
          >
            Cerrar
          </button>
      }
      width={900}
      className="rounded-lg"
      bodyStyle={{ padding: '1.5rem', overflow: 'visible' }}
      zIndex={1001} // Asegura que el modal del mapa esté por encima
    >
      <Card title={ubicacion ? `Mapa de ${ubicacion.nombre}` : 'Mapa'} className="shadow-sm">
        <div className="w-full h-[500px] rounded-lg overflow-hidden">
          <APIProvider apiKey={apiKey}>
            <Map
              mapId="default-map"
              center={center}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
              defaultZoom={15}
              gestureHandling={'cooperative'} // Permite scroll en el modal principal
              disableDefaultUI={false}
            >
              {ubicacion && <AdvancedMarker position={markerPosition} />}
            </Map>
          </APIProvider>
        </div>
      </Card>
    </Modal>
  );
};

export default LocationMapModal;