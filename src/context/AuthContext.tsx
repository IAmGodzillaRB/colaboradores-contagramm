import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  setPersistence,
  browserLocalPersistence,
  User as FirebaseUser,
} from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import CircularProgress from '@mui/material/CircularProgress';

interface User {
  uid: string;
  email: string | null;
  name: string;
  [key: string]: any; // Permite incluir otros datos del usuario
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const auth = getAuth();
    const db = getFirestore();

    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        onAuthStateChanged(auth, async (currentUser: FirebaseUser | null) => {
          if (currentUser) {
            try {
              const userRef = doc(db, 'usuarios', currentUser.uid);
              const userDoc = await getDoc(userRef);

              if (userDoc.exists()) {
                setUser({
                  uid: currentUser.uid,
                  email: currentUser.email,
                  name: userDoc.data().name || 'Usuario sin nombre',
                  ...userDoc.data(),
                });
              } else {
                console.error('El documento del usuario no existe en Firestore');
                setUser({
                  uid: currentUser.uid,
                  email: currentUser.email,
                  name: 'Usuario no registrado',
                });
              }
            } catch (error) {
              console.error('Error al obtener el usuario de Firestore:', error);
              setUser(null);
            }
          } else {
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

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
