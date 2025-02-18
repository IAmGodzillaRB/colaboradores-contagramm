import React, { useState, useEffect } from 'react';
import { db, collection, doc, setDoc, getDocs, deleteDoc, updateDoc } from '../../service/firebaseConfig';
import { createUserWithEmailAndPassword, getAuth, sendEmailVerification } from 'firebase/auth';
import { Table, Input, Button, Tag, Tooltip, notification } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import UserModal from '../../components/modals/UserModal';

interface User {
  id: string;
  nombre: string;
  email: string;
  rol: string;
}

const UsersManagement: React.FC = () => {
  const [openAddModal, setOpenAddModal] = useState<boolean>(false);
  const [openEditModal, setOpenEditModal] = useState<boolean>(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    id: '',
    nombre: '',
    email: '',
    password: '',
    rol: 'usuario',
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserRole] = useState<string>('admin');
  const [modalLoading, setModalLoading] = useState<boolean>(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const querySnapshot = await getDocs(collection(db, 'usuarios'));
      const usuarios = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as User));
      setAllUsers(usuarios);
      setFilteredUsers(usuarios);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(errorMessage);
      showNotification('error', 'Error al cargar usuarios', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string, description?: string) => {
    notification[type]({
      message,
      description,
    });
  };

  const handleAddUser = async (values: any) => {
    const { nombre, email, password, rol } = values;
  
    try {
      setModalLoading(true);
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      // Enviar correo de verificación
      await sendEmailVerification(user);
  
      // Crear el documento en Firestore
      await setDoc(doc(db, 'usuarios', user.uid), { nombre, email, rol });
  
      fetchUsers();
      showNotification('success', 'Éxito', 'Usuario creado correctamente. Se ha enviado un correo de verificación.');
      setFormData({ id: '', nombre: '', email: '', password: '', rol: 'usuario' });
      setOpenAddModal(false);
      console.log("Correo de verificación enviado:", user.emailVerified);
    } catch (error: any) {
      console.error('Error al crear usuario:', error);
      showNotification('error', 'Error al crear usuario', error.message);
    } finally {
      setModalLoading(false);
    }
  };
  const handleEditUser = async (values: any) => {
    const { id, nombre, email, rol } = values;

    try {
      setModalLoading(true);
      await updateDoc(doc(db, 'usuarios', id), { nombre, email, rol });

      fetchUsers();
      showNotification('success', 'Éxito', 'Usuario actualizado correctamente.');
      setFormData({ id: '', nombre: '', email: '', password: '', rol: 'usuario' });
      setOpenEditModal(false);
    } catch (error: any) {
      console.error('Error al actualizar usuario:', error);
      showNotification('error', 'Error al actualizar usuario', error.message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleSearch = (searchTerm: string) => {
    const filtered = allUsers.filter(
      (user) =>
        user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const columns = [
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Rol',
      dataIndex: 'rol',
      key: 'rol',
      render: (rol: string) => (
        <Tag color={rol === 'admin' ? 'blue' : rol === 'editor' ? 'orange' : 'green'}>{rol}</Tag>
      ),
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (record: User) => (
        <div className="flex space-x-2">
          {currentUserRole === 'admin' && (
            <Tooltip title="Editar usuario">
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => {
                  setFormData({ ...record, password: '' });
                  setOpenEditModal(true);
                }}
                aria-label="Editar usuario"
              />
            </Tooltip>
          )}
          {currentUserRole === 'admin' && (
            <Tooltip title="Eliminar usuario">
              <Button
                type="link"
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record.id)}
                aria-label="Eliminar usuario"
                danger
              />
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  const handleDelete = async (id: string) => {
    notification.warning({
      message: '¿Estás seguro?',
      description: 'Esta acción eliminará al usuario de forma permanente.',
      duration: 0,
      btn: (
        <div>
          <Button
            type="primary"
            danger
            onClick={async () => {
              notification.destroy();
              await deleteDoc(doc(db, 'usuarios', id));
              setAllUsers((prevList) => prevList.filter((user) => user.id !== id));
              setFilteredUsers((prevList) => prevList.filter((user) => user.id !== id));
              showNotification('success', 'Éxito', 'El usuario ha sido eliminado correctamente.');
            }}
          >
            Sí, eliminar
          </Button>
          <Button
            style={{ marginLeft: 8 }}
            onClick={() => notification.destroy()}
          >
            Cancelar
          </Button>
        </div>
      ),
    });
  };

  return (
    <div className="flex justify-center h-screen bg-gray-100">
      <div className="w-full px-6 py-8 flex flex-col h-full bg-white shadow-lg rounded-lg">
        <h2 className="text-3xl font-semibold mb-6 text-center text-blue-800">Gestión de Usuarios</h2>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <Input
            placeholder="Buscar por nombre o email"
            className="w-full md:w-1/3"
            onChange={(e) => handleSearch(e.target.value)}
            aria-label="Buscar usuarios por nombre o email"
          />
          {currentUserRole === 'admin' && (
            <div className="flex space-x-2 mt-4 md:mt-0">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setFormData({ id: '', nombre: '', email: '', password: '', rol: 'usuario' });
                  setOpenAddModal(true);
                }}
                aria-label="Agregar nuevo usuario"
                className="p-2 sm:px-4 sm:py-2 flex items-center justify-center"
              >
                <span className="hidden sm:inline">Agregar Usuario</span>
              </Button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto flex flex-col h-full">
          <Table
            dataSource={filteredUsers}
            columns={columns}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ['10', '15', '20'],
            }}
            bordered
            scroll={{ x: 'max-content' }}
            loading={loading}
            className="w-full"
          />
        </div>

        <UserModal
          open={openAddModal}
          onClose={() => setOpenAddModal(false)}
          onSubmit={handleAddUser}
          formData={formData}
          isEditMode={false}
          loading={modalLoading}
        />

        <UserModal
          open={openEditModal}
          onClose={() => setOpenEditModal(false)}
          onSubmit={handleEditUser}
          formData={formData}
          isEditMode={true}
          loading={modalLoading}
        />
      </div>
    </div>
  );
};

export default UsersManagement;