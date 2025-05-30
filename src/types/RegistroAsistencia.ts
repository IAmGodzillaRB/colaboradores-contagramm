import { Timestamp } from 'firebase/firestore';

export interface RegistroAsistencia {
  id?: string;
  userId: string;
  ubicacionId: string;
  tipo: 'entrada' | 'comida' | 'salida';
  timestamp: Date | Timestamp;
  distancia: number | null;
  dentroDelRango: boolean;
}