import React, { useState, useEffect } from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { db, collection, doc, setDoc, getDocs } from '../../service/firebaseConfig';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import Swal from 'sweetalert2';

// Definir el tipo para los datos del usuario
interface User {
  id: string;
  nombre: string;
  email: string;
}

const UsersManagement: React.FC = () => {
  const [open, setOpen] = useState<boolean>(false);
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
  });

  // Cargar usuarios de Firestore
  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'usuarios'));
      const usuarios = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as User));
      setUsers(usuarios);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      Swal.fire('Error', 'No se pudo cargar la lista de usuarios.', 'error');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Manejar cambios en el formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Guardar usuario
  const handleSave = async () => {
    const { nombre, email, password } = formData;

    if (!nombre || !email || !password) {
      Swal.fire('Error', 'Todos los campos son obligatorios.', 'warning');
      return;
    }

    try {
      // Crear usuario en Firebase Authentication
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Guardar datos en Firestore usando el UID como ID del documento
      await setDoc(doc(db, 'usuarios', user.uid), { nombre, email });

      // Recargar la lista de usuarios
      fetchUsers();

      Swal.fire('¡Éxito!', 'Usuario creado correctamente.', 'success');
      setFormData({ nombre: '', email: '', password: '' });
      setOpen(false);
    } catch (error: any) {
      console.error('Error al crear usuario:', error);
      Swal.fire('Error', `No se pudo crear el usuario: ${error.message}`, 'error');
    }
  };

  return (
    <div>
      <Button variant="contained" color="primary" onClick={() => setOpen(true)}>
        Agregar Usuario
      </Button>

      <Table style={{ marginTop: 20 }}>
        <TableHead>
          <TableRow>
            <TableCell>Nombre</TableCell>
            <TableCell>Email</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.nombre}</TableCell>
              <TableCell>{user.email}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Modal open={open} onClose={() => setOpen(false)}>
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
          <h2>Agregar Usuario</h2>
          <TextField
            fullWidth
            margin="normal"
            label="Nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Contraseña"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
            <Button variant="contained" color="primary" onClick={handleSave}>
              Guardar
            </Button>
            <Button variant="contained" color="error" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          </div>
        </Box>
      </Modal>
    </div>
  );
};

export default UsersManagement;