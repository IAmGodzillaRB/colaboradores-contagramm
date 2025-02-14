import React, { useState, useEffect } from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import { db, collection, getDocs, addDoc, doc, updateDoc } from '../../service/firebaseConfig'; // Ajusta la ruta si es necesario
import Swal from 'sweetalert2';

// Definir los tipos de los datos
interface Puesto {
  id: string;
  nombrePuesto: string;
}

interface Colaborador {
  idColaborador: string;
  nombre: string;
  idPuesto: string;
  estatus: boolean;
}

interface ColaboradorModalProps {
  open: boolean;
  isEditMode: boolean;
  collaboratorData?: Colaborador;  // Colaborador opcional para cuando se edita
  onClose: () => void;
  onUpdate: () => void;
}

const ColaboradorModal: React.FC<ColaboradorModalProps> = ({ open, isEditMode, collaboratorData, onClose, onUpdate }) => {
  const [formData, setFormData] = useState<Colaborador>({
    idColaborador: '',
    nombre: '',
    idPuesto: '',
    estatus: true,  // Estatus como booleano (true = activo, false = inactivo)
  });

  const [puestos, setPuestos] = useState<Puesto[]>([]); // Opciones de la colección de puestos

  // Obtener datos de la colección 'puestos' al cargar el componente
  useEffect(() => {
    const fetchPuestos = async () => {
      try {
        const puestosCollection = collection(db, 'puestos');
        const puestosSnapshot = await getDocs(puestosCollection);
        const puestosData = puestosSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Puesto[];

        const sortedPuestos = puestosData.sort((a, b) =>
          a.nombrePuesto.localeCompare(b.nombrePuesto)
        );
    
        setPuestos(sortedPuestos);

      } catch (error) {
        console.error('Error al obtener los puestos:', error);
      }
    };
    fetchPuestos();
  }, []);

  // Inicializar datos del formulario cuando se abra el modal
  useEffect(() => {
    if (isEditMode && collaboratorData) {
      setFormData({
        idColaborador: collaboratorData.idColaborador || '',
        nombre: collaboratorData.nombre || '',
        idPuesto: collaboratorData.idPuesto || '',
        estatus: collaboratorData.estatus, // El estatus ya es un booleano
      });
    } else {
      setFormData({
        idColaborador: '',
        nombre: '',
        idPuesto: '',
        estatus: true, // Por defecto, 'Activo' (true)
      });
    }
  }, [isEditMode, collaboratorData]);

  // Manejar cambios en los campos
  const handleChange = (e: React.ChangeEvent<{ name?: string; value: string }>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name as string]: name === 'estatus' ? value === 'true' : value });
  };

  // Manejar cambios en el Select
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: name === 'estatus' ? value === 'true' : value });
  };

  // Guardar cambios
  const handleSave = async () => {
    try {
      const puestoRef = doc(db, 'puestos', formData.idPuesto);

      const colaboradorData = {
        idColaborador: formData.idColaborador,
        nombre: formData.nombre,
        idPuesto: puestoRef,
        estatus: formData.estatus ? 'Activo' : 'Inactivo', // Convertir a string para almacenar en Firestore
      };

      if (isEditMode) {
        const docRef = doc(db, 'colaboradores', collaboratorData!.idColaborador); // ¡Asegurarse de que 'collaboratorData' no sea undefined!
        await updateDoc(docRef, colaboradorData);
        Swal.fire('¡Éxito!', 'Colaborador actualizado correctamente.', 'success');
      } else {
        const collectionRef = collection(db, 'colaboradores');
        const docRef = await addDoc(collectionRef, colaboradorData);
        Swal.fire('¡Éxito!', 'Nuevo colaborador agregado correctamente.', 'success');
        console.log("Nuevo colaborador ID:", docRef.id); // Obtener el ID generado por Firestore
      }

      onUpdate();  // Actualiza la lista de colaboradores
      onClose();   // Cierra el modal
    } catch (error) {
      console.error('Error al guardar el colaborador:', error);
      Swal.fire('Error', 'Hubo un problema al guardar los datos.', 'error');
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
        <h2>{isEditMode ? 'Editar Colaborador' : 'Agregar Colaborador'}</h2>
        <TextField
          fullWidth
          margin="normal"
          label="ID Colaborador"
          name="idColaborador"
          value={formData.idColaborador}
          onChange={handleChange}
        />
        <TextField
          fullWidth
          margin="normal"
          label="Nombre"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
        />
        <FormControl fullWidth margin="normal">
          <InputLabel id="puesto-label">Puesto</InputLabel>
          <Select
            labelId="puesto-label"
            id="idPuesto"
            name="idPuesto"
            value={formData.idPuesto}
            onChange={handleSelectChange}  // Usamos el nuevo manejador aquí
          >
            {puestos.map((puesto) => (
              <MenuItem key={puesto.id} value={puesto.id}>
                {puesto.nombrePuesto}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth margin="normal">
          <InputLabel id="estatus-label">Estatus</InputLabel>
          <Select
            labelId="estatus-label"
            id="estatus"
            name="estatus"
            value={formData.estatus.toString()}  // Convertir boolean a string para mostrar en Select
            onChange={handleSelectChange}  // Usamos el nuevo manejador aquí
          >
            <MenuItem value="true">Activo</MenuItem>
            <MenuItem value="false">Inactivo</MenuItem>
          </Select>
        </FormControl>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
          <Button variant="contained" color="primary" onClick={handleSave}>
            Guardar
          </Button>
          <Button variant="contained" color="error" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </Box>
    </Modal>
  );
};

export default ColaboradorModal;
