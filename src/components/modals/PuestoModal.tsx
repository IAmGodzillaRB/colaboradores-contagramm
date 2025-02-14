import React, { useEffect, useState } from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Swal from 'sweetalert2';
import { db, collection, addDoc, doc, updateDoc, getDocs, query, where } from '../../service/firebaseConfig';

// Definimos la interfaz para los datos del puesto
interface PuestoData {
  id?: string;
  nombrePuesto: string;
}

// Definimos las propiedades que recibirá el componente
interface PuestoModalProps {
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
  puestoData?: PuestoData;
  isEditMode: boolean;
}

const PuestoModal: React.FC<PuestoModalProps> = ({ open, onClose, onUpdate, puestoData, isEditMode }) => {
  const [formData, setFormData] = useState<PuestoData>({ nombrePuesto: '' });

  useEffect(() => {
    if (isEditMode && puestoData) {
      setFormData({ nombrePuesto: puestoData.nombrePuesto });
    } else {
      setFormData({ nombrePuesto: '' });
    }
  }, [puestoData, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!formData.nombrePuesto.trim()) {
      Swal.fire('Error', 'El nombre del puesto no puede estar vacío.', 'warning');
      return;
    }

    try {
      const collectionRef = collection(db, 'puestos');
      const normalizedNombrePuesto = formData.nombrePuesto.trim().toUpperCase();

      const q = query(collectionRef, where('nombrePuesto', '==', normalizedNombrePuesto));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty && (!isEditMode || querySnapshot.docs[0].id !== puestoData?.id)) {
        Swal.fire('Error', 'Este puesto ya existe. Intenta con otro nombre.', 'error');
        onClose();
        return;
      }

      if (isEditMode && puestoData?.id) {
        const puestoRef = doc(db, 'puestos', puestoData.id);
        await updateDoc(puestoRef, { nombrePuesto: normalizedNombrePuesto });
        onClose();
        Swal.fire('¡Éxito!', 'Puesto actualizado correctamente.', 'success').then(() => onUpdate());
      } else {
        await addDoc(collectionRef, { nombrePuesto: normalizedNombrePuesto });
        onClose();
        Swal.fire('¡Éxito!', 'Puesto agregado correctamente.', 'success').then(() => onUpdate());
      }
      
    } catch (error) {
      console.error('Error al guardar el puesto:', error);
      Swal.fire('Error', 'Hubo un problema al guardar el puesto.', 'error');
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
        }}
      >
        <h2>{isEditMode ? 'Editar Puesto' : 'Agregar Puesto'}</h2>
        <TextField
          fullWidth
          margin="normal"
          label="Nombre del Puesto"
          name="nombrePuesto"
          value={formData.nombrePuesto}
          onChange={handleChange}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
          <Button variant="contained" color="primary" onClick={handleSave}>
            {isEditMode ? 'Actualizar' : 'Guardar'}
          </Button>
          <Button variant="contained" color="error" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </Box>
    </Modal>
  );
};

export default PuestoModal;
