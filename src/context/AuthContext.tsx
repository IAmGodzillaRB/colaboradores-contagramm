import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  setPersistence,
  browserLocalPersistence,
  User as FirebaseUser,
} from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import CircularProgress from '@mui/material/CircularProgress';

// Definir el tipo de usuario
interface User {
  uid: string;
  email: string | null;
  nombre: string;
  rol: string; // Asegúrate de incluir el rol
  [key: string]: any; // Permite incluir otros datos del usuario
}

// Definir el tipo del contexto
interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props para el AuthProvider
interface AuthProviderProps {
  children: ReactNode;
}

// Proveedor de autenticación
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const auth = getAuth();
    const db = getFirestore();

    // Configurar persistencia de sesión
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        // Escuchar cambios en el estado de autenticación
        onAuthStateChanged(auth, async (currentUser: FirebaseUser | null) => {
          if (currentUser) {
            try {
              // Obtener el documento del usuario en Firestore
              const userRef = doc(db, 'usuarios', currentUser.uid);
              const userDoc = await getDoc(userRef);

              if (userDoc.exists()) {
                // Si el documento existe, asignar los datos al estado
                setUser({
                  uid: currentUser.uid,
                  email: currentUser.email,
                  nombre: userDoc.data().nombre || 'Usuario sin nombre',
                  rol: userDoc.data().rol || 'usuario', // Asegúrate de obtener el rol
                  ...userDoc.data(),
                });
              } else {
                // Si el documento no existe, crear uno nuevo
                console.warn('El documento del usuario no existe en Firestore. Creando uno nuevo...');
                await setDoc(userRef, {
                  nombre: 'Usuario no registrado',
                  email: currentUser.email,
                  rol: 'usuario', // Rol por defecto
                });
                setUser({
                  uid: currentUser.uid,
                  email: currentUser.email,
                  nombre: 'Usuario no registrado',
                  rol: 'usuario', // Asignar el rol por defecto
                });
              }
            } catch (error) {
              console.error('Error al obtener el usuario de Firestore:', error);
              setUser(null);
            }
          } else {
            // Si no hay usuario autenticado, limpiar el estado
            setUser(null);
          }
          setLoading(false);
        });
      })
      .catch((error) => {
        console.error('Error al configurar la persistencia de sesión:', error);
        setLoading(false);
      });
  }, []);

  // Función para cerrar sesión
  const logout = async (): Promise<void> => {
    const auth = getAuth();
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

// Hook para usar el contexto de autenticación
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};