import React, { useState, useEffect, useCallback } from 'react';
import { notification } from 'antd';
import { useAuth } from '../../context/AuthContext';
import { db, collection, getDocs, doc, getDoc, addDoc, query, where } from '../../service/firebaseConfig';
import { Timestamp } from 'firebase/firestore';
import { CheckCircle, MapPin, AlertCircle, Navigation, Clock, Building2, Zap } from 'lucide-react';
import { RegistroAsistencia } from '../../types/RegistroAsistencia';
import { Ubicacion } from '../../types/Ubicacion';
import { User } from '../../types/User'; // Adjust the import path as necessary
 // Assuming types are exported from a types file

const AttendanceVerification: React.FC = () => {
  const { user } = useAuth();
  const [isWithinRadius, setIsWithinRadius] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentDistance, setCurrentDistance] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [ubicacionesAsignadas, setUbicacionesAsignadas] = useState<Ubicacion[]>([]);
  const [selectedUbicacion, setSelectedUbicacion] = useState<Ubicacion | null>(null);
  const [yaVerificado, setYaVerificado] = useState<{ [key: string]: boolean }>({});
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  // Haversine formula for distance calculation
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
    const R = 6371e3; // Earth's radius in meters
    const φ1 = toRadians(lat1);
    const φ2 = toRadians(lat2);
    const Δφ = toRadians(lat2 - lat1);
    const Δλ = toRadians(lon2 - lon1);

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }, []);

  // Check if attendance was already recorded today for a specific location
  const verificarAsistenciaHoy = useCallback(async (userId: string, ubicacionId: string) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const asistenciaQuery = query(
        collection(db, 'registros_asistencia'),
        where('userId', '==', userId),
        where('ubicacionId', '==', ubicacionId),
        where('timestamp', '>=', Timestamp.fromDate(today)),
        where('timestamp', '<', Timestamp.fromDate(tomorrow))
      );

      const asistenciaSnapshot = await getDocs(asistenciaQuery);
      return !asistenciaSnapshot.empty;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setLocationError(errorMessage);
      notification.error({
        message: 'Error',
        description: errorMessage,
      });
      return false;
    }
  }, []);

  // Fetch assigned locations
  const fetchUbicacionesAsignadas = useCallback(async () => {
    if (!user?.uid) {
      setLocationError('Usuario no autenticado.');
      return;
    }

    try {
      setLoading(true);
      // Get user data
      const userDoc = await getDoc(doc(db, 'usuarios', user.uid));

      if (!userDoc.exists()) {
        setLocationError('Usuario no encontrado.');
        return;
      }

      const userData = { id: userDoc.id, ...userDoc.data() } as User;

      if (!userData.ubicacionesAsignadas || userData.ubicacionesAsignadas.length === 0) {
        setLocationError('No tienes ubicaciones de verificación asignadas. Contacta a tu supervisor.');
        return;
      }

      // Fetch all assigned locations
      const ubicacionesPromises = userData.ubicacionesAsignadas.map(async (ubicacionId) => {
        const ubicacionDoc = await getDoc(doc(db, 'ubicaciones', ubicacionId));
        if (ubicacionDoc.exists()) {
          const ubicacionData = { id: ubicacionDoc.id, ...ubicacionDoc.data() } as Ubicacion;
          if (ubicacionData.activa) {
            const verified = await verificarAsistenciaHoy(user.uid, ubicacionId);
            setYaVerificado((prev) => ({ ...prev, [ubicacionId]: verified }));
            return ubicacionData;
          }
        }
        return null;
      });

      const ubicaciones = (await Promise.all(ubicacionesPromises)).filter((loc): loc is Ubicacion => loc !== null);

      setUbicacionesAsignadas(ubicaciones);
      if (ubicaciones.length > 0) {
        setSelectedUbicacion(ubicaciones[0]); // Default to first active location
      } else {
        setLocationError('No hay ubicaciones activas asignadas.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setLocationError(errorMessage);
      notification.error({
        message: 'Error',
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }, [user, verificarAsistenciaHoy]);

  // Get current position and calculate distance
  const getCurrentPosition = useCallback(() => {
    setLocationLoading(true);
    return new Promise<void>((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setCurrentPosition({ lat: latitude, lng: longitude });

            if (selectedUbicacion) {
              const distance = calculateDistance(
                latitude,
                longitude,
                selectedUbicacion.latitud,
                selectedUbicacion.longitud
              );
              setCurrentDistance(distance);
              setIsWithinRadius(distance <= selectedUbicacion.radio);
            }
            setLocationLoading(false);
            resolve();
          },
          (error) => {
            setLocationError('No se pudo obtener la ubicación del dispositivo: ' + error.message);
            notification.error({
              message: 'Error de Geolocalización',
              description: error.message,
            });
            setLocationLoading(false);
            reject(error);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
      } else {
        const error = 'La geolocalización no está soportada en este navegador.';
        setLocationError(error);
        notification.error({
          message: 'Error',
          description: error,
        });
        setLocationLoading(false);
        reject(new Error(error));
      }
    });
  }, [selectedUbicacion, calculateDistance]);

  // Register attendance
  const handleCheckIn = useCallback(
    async (tipo: 'entrada' | 'comida' | 'salida') => {
      if (!selectedUbicacion || !user?.uid) return;

      try {
        setLoading(true);
        await getCurrentPosition();

        if (!currentPosition) {
          notification.error({
            message: 'Error',
            description: 'No se pudo obtener tu ubicación actual.',
          });
          return;
        }

        if (!isWithinRadius) {
          notification.error({
            message: 'Fuera de rango',
            description: `Estás a ${currentDistance?.toFixed(2)} metros de la ubicación asignada. Debes estar dentro de ${selectedUbicacion.radio} metros.`,
          });
          return;
        }

        const registro: RegistroAsistencia = {
          userId: user.uid,
          ubicacionId: selectedUbicacion.id,
          tipo,
          timestamp: new Date(),
          distancia: currentDistance || null,
          dentroDelRango: isWithinRadius,
        };

        await addDoc(collection(db, 'registros_asistencia'), {
          ...registro,
          timestamp: Timestamp.fromDate(registro.timestamp as Date),
        });

        setYaVerificado((prev) => ({ ...prev, [selectedUbicacion.id]: true }));
        notification.success({
          message: 'Asistencia registrada',
          description: `Asistencia de tipo ${tipo} registrada correctamente en ${selectedUbicacion.nombre}.`,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
        notification.error({
          message: 'Error al registrar asistencia',
          description: errorMessage,
        });
      } finally {
        setLoading(false);
      }
    },
    [selectedUbicacion, currentPosition, isWithinRadius, currentDistance, user, getCurrentPosition]
  );

  // Load assigned locations on mount
  useEffect(() => {
    fetchUbicacionesAsignadas();
  }, [fetchUbicacionesAsignadas]);

  // Get current position when selected location changes
  useEffect(() => {
    if (selectedUbicacion && !yaVerificado[selectedUbicacion.id]) {
      getCurrentPosition();
    }
  }, [selectedUbicacion, yaVerificado, getCurrentPosition]);

  // Dynamic design calculations
  const distanciaFaltante = currentDistance && selectedUbicacion ? Math.max(0, currentDistance - selectedUbicacion.radio) : 0;
  const porcentajeProximidad = currentDistance && selectedUbicacion 
    ? Math.max(0, Math.min(100, ((selectedUbicacion.radio - currentDistance) / selectedUbicacion.radio) * 100))
    : 0;

  // Dynamic colors based on proximity
  const getStatusColor = () => {
    if (!selectedUbicacion) return 'red';
    if (yaVerificado[selectedUbicacion.id]) return 'green';
    if (isWithinRadius) return 'green';
    if (currentDistance && selectedUbicacion && currentDistance <= selectedUbicacion.radio * 1.5) return 'yellow';
    return 'red';
  };

  const statusColor = getStatusColor();
  const colorClasses = {
    green: {
      bg: 'bg-gradient-to-br from-green-50 to-emerald-100',
      border: 'border-green-200',
      text: 'text-green-800',
      badge: 'bg-green-100 text-green-800 border-green-200',
      button: 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700',
      icon: 'text-green-600',
      pulse: 'animate-pulse bg-green-200'
    },
    yellow: {
      bg: 'bg-gradient-to-br from-yellow-50 to-amber-100',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      button: 'bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700',
      icon: 'text-yellow-600',
      pulse: 'animate-pulse bg-yellow-200'
    },
    red: {
      bg: 'bg-gradient-to-br from-red-50 to-rose-100',
      border: 'border-red-200',
      text: 'text-red-800',
      badge: 'bg-red-100 text-red-800 border-red-200',
      button: 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700',
      icon: 'text-red-600',
      pulse: 'animate-pulse bg-red-200'
    }
  };

  const colors = colorClasses[statusColor];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Verificación</h1>
          <p className="text-slate-600">Control de Asistencia</p>
        </div>

        {/* Error State */}
        {locationError && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
              <div>
                <p className="text-red-800 font-medium">Error de ubicación</p>
                <p className="text-red-600 text-sm mt-1">{locationError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Location Selector */}
        {ubicacionesAsignadas.length > 1 && !locationError && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-600 mb-2">Seleccionar Ubicación</label>
            <select
              value={selectedUbicacion?.id || ''}
              onChange={(e) => {
                const ubicacion = ubicacionesAsignadas.find((loc) => loc.id === e.target.value);
                setSelectedUbicacion(ubicacion || null);
              }}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {ubicacionesAsignadas.map((ubicacion) => (
                <option key={ubicacion.id} value={ubicacion.id}>
                  {ubicacion.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Main Card */}
        {selectedUbicacion && !locationError && (
          <div className={`${colors.bg} ${colors.border} border-2 rounded-2xl p-6 shadow-xl transition-all duration-500`}>
            {/* Location Info */}
            <div className="text-center mb-6">
              <div className={`inline-flex items-center justify-center w-12 h-12 ${colors.badge} rounded-full mb-3 border-2`}>
                <MapPin className={`w-6 h-6 ${colors.icon}`} />
              </div>
              <h2 className={`text-xl font-bold ${colors.text} mb-1`}>{selectedUbicacion.nombre}</h2>
              <p className="text-slate-600 text-sm mb-3">{selectedUbicacion.descripcion}</p>
              <div className={`inline-flex items-center px-3 py-1 ${colors.badge} rounded-full text-sm font-medium border`}>
                <span>Radio: {selectedUbicacion.radio}m</span>
              </div>
            </div>

            {/* Already Verified */}
            {yaVerificado[selectedUbicacion.id] && (
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-green-800 mb-2">¡Asistencia Registrada!</h3>
                <p className="text-green-600">Ya has marcado tu asistencia para hoy</p>
                <div className="mt-4 flex items-center justify-center space-x-4 text-sm text-green-700">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>{new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Distance Info */}
            {!yaVerificado[selectedUbicacion.id] && currentPosition && (
              <div className="mb-6">
                <div className="text-center mb-4">
                  <div className={`inline-flex items-center justify-center w-12 h-12 ${colors.badge} rounded-full mb-3 border-2 ${locationLoading ? colors.pulse : ''}`}>
                    <Navigation className={`w-6 h-6 ${colors.icon}`} />
                  </div>
                  {currentDistance !== null ? (
                    <>
                      <div className={`text-2xl font-bold ${colors.text} mb-2`}>{currentDistance.toFixed(0)}m</div>
                      {isWithinRadius ? (
                        <div className="space-y-2">
                          <div className={`inline-flex items-center px-4 py-2 ${colors.badge} rounded-full font-medium border`}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            ¡Dentro del rango!
                          </div>
                          <p className="text-slate-600 text-sm">Perfecto, puedes registrar tu asistencia</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className={`inline-flex items-center px-4 py-2 ${colors.badge} rounded-full font-medium border`}>
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Te faltan {distanciaFaltante.toFixed(0)}m
                          </div>
                          <p className="text-slate-600 text-sm">Acércate más a la ubicación asignada</p>
                          <div className="w-full bg-slate-200 rounded-full кола h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${statusColor === 'red' ? 'bg-red-400' : statusColor === 'yellow' ? 'bg-yellow-400' : 'bg-green-400'}`}
                              style={{ width: `${Math.min(100, porcentajeProximidad)}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-slate-500">Proximidad: {porcentajeProximidad.toFixed(0)}%</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-slate-600">
                      <div className="animate-spin w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full mx-auto mb-2"></div>
                      Calculando distancia...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {!yaVerificado[selectedUbicacion.id] && (
              <div className="space-y-3">
                {['entrada', 'comida', 'salida'].map((tipo) => (
                  <button
                    key={tipo}
                    onClick={() => handleCheckIn(tipo as 'entrada' | 'comida' | 'salida')}
                    disabled={!isWithinRadius || loading || locationLoading}
                    className={`w-full py-4 px-6 rounded-xl font-bold text-white transition-all duration-300 transform ${
                      isWithinRadius && !loading && !locationLoading
                        ? `${colors.button} hover:scale-105 shadow-lg hover:shadow-xl`
                        : 'bg-slate-300 cursor-not-allowed'
                    }`}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                        <span>Registrando...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <CheckCircle className="w-5 h-5" />
                        <span>Registrar {tipo.charAt(0).toUpperCase() + tipo.slice(1)}</span>
                      </div>
                    )}
                  </button>
                ))}
                <button
                  onClick={getCurrentPosition}
                  disabled={locationLoading}
                  className="w-full py-3 px-6 rounded-xl font-medium text-slate-700 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200"
                >
                  {locationLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full"></div>
                      <span>Actualizando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <Navigation className="w-4 h-4" />
                      <span>Actualizar Ubicación</span>
                    </div>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-slate-500 text-sm">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Zap className="w-4 h-4" />
            <span>Sistema de Control de Asistencia</span>
          </div>
          <p>Mantén activada tu ubicación para mejores resultados</p>
        </div>
      </div>
    </div>
  );
};

export default AttendanceVerification;