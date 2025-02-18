import React, { useState, useEffect } from 'react';
import { Button, notification, Alert } from 'antd';
import { CheckCircleOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AttendanceVerification: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isWithinRadius, setIsWithinRadius] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentDistance, setCurrentDistance] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const targetLocation = {
    latitude: 17.072036983980418,
    longitude: -96.75978056140424,
  };

  const allowedRadius = 100;
  const marginOfError = 1.1;

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
    const R = 6371e3;
    const φ1 = toRadians(lat1);
    const φ2 = toRadians(lat2);
    const Δφ = toRadians(lat2 - lat1);
    const Δλ = toRadians(lon2 - lon1);

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const checkUserLocation = () => {
    setLocationError(null);
    setLoading(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const distance = calculateDistance(latitude, longitude, targetLocation.latitude, targetLocation.longitude);

          setCurrentDistance(Math.round(distance));
          setIsWithinRadius(distance <= allowedRadius * marginOfError);

          notification.success({
            message: 'Ubicación actualizada',
            description: `Estás a ${Math.round(distance)} metros del punto de verificación.`,
          });
          setLoading(false);
        },
        (error) => {
          const errors = {
            1: 'Permiso de geolocalización denegado. Activa los permisos en tu navegador.',
            2: 'Información de ubicación no disponible. Verifica tu conexión GPS.',
            3: 'Se agotó el tiempo para obtener tu ubicación. Inténtalo de nuevo.',
          };
          setLocationError(errors[error.code as 1 | 2 | 3] || 'Error desconocido al obtener tu ubicación.');
          notification.error({ message: 'Error de geolocalización', description: locationError });
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLocationError('Tu navegador no soporta geolocalización.');
      notification.error({ message: 'Error', description: 'Tu navegador no soporta geolocalización.' });
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.rol !== 'usuario') {
      navigate('/dashboard');
    } else {
      checkUserLocation();
    }
  }, [user, navigate]);

  const handleVerifyAttendance = () => {
    if (!isWithinRadius) {
      notification.error({
        message: 'Fuera de rango',
        description: `Debes estar dentro de ${allowedRadius} metros para verificar asistencia.`,
      });
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      notification.success({
        message: 'Asistencia verificada',
        description: 'Tu asistencia ha sido registrada correctamente.',
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      });
    }, 2000);
  };

  return (
    <div className="p-6 max-w-lg mx-auto bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">Verificar Asistencia</h1>

      {locationError && <Alert message="Error de ubicación" description={locationError} type="error" showIcon className="mb-4" />}

      <div className="mb-6 bg-gray-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Estado actual:</h2>
        {currentDistance !== null && (
          <p className="mb-2">
            <EnvironmentOutlined className="mr-2" />
            Distancia al punto de verificación: <strong>{currentDistance} metros</strong>
          </p>
        )}
        <p className={isWithinRadius ? "text-green-600" : "text-red-600"}>
          {isWithinRadius
            ? "✓ Estás dentro del radio permitido para verificar asistencia"
            : "✗ Debes estar dentro del radio de 100 metros para verificar asistencia"}
        </p>
      </div>

      <div className="flex flex-col space-y-4">
        <Button type="primary" icon={<CheckCircleOutlined />} loading={loading} onClick={handleVerifyAttendance} disabled={!isWithinRadius} size="large" className="w-full">
          Verificar Asistencia
        </Button>

        <Button type="default" icon={<EnvironmentOutlined />} onClick={checkUserLocation} className="w-full">
          Actualizar mi ubicación
        </Button>
      </div>
    </div>
  );
};

export default AttendanceVerification;
