import React, { useState, useEffect, useCallback } from 'react';
import { db, collection, doc, getDocs, deleteDoc, updateDoc } from '../../service/firebaseConfig';
import { Table, Input, Button, Tag, Tooltip, notification } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined, EnvironmentOutlined } from '@ant-design/icons';
import UserModal from '../../components/modals/UserModal';
import LocationManagementModal from '../../components/modals/LocationManagementModal';
import { User } from '../../types/User';
import { Ubicacion } from '../../types/Ubicacion';

const UsersManagement: React.FC = () => {
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
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Obtener usuarios
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const querySnapshot = await getDocs(collection(db, 'usuarios'));
      const usuarios = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        ubicacionesAsignadas: doc.data().ubicacionesAsignadas || [],
      } as User));
      setAllUsers(usuarios);
      setFilteredUsers(usuarios);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      showNotification('error', 'Error al cargar usuarios', errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener ubicaciones
  const fetchUbicaciones = useCallback(async () => {
    try {
      const ubicacionesCollection = collection(db, 'ubicaciones');
      const ubicacionesSnapshot = await getDocs(ubicacionesCollection);
      const ubicacionesData: Ubicacion[] = ubicacionesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data() as Omit<Ubicacion, 'id'>,
      }));
      setUbicaciones(ubicacionesData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      showNotification('error', 'Error al cargar ubicaciones', errorMessage);
    }
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    fetchUsers();
    fetchUbicaciones();
  }, [fetchUsers, fetchUbicaciones]);

  const showNotification = (type: 'success' | 'error', message: string, description?: string) => {
    notification[type]({
      message,
      description,
    });
  };

  // Editar usuario
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
      showNotification('error', 'Error al actualizar usuario', error.message);
    } finally {
      setModalLoading(false);
    }
  };

  // Eliminar usuario
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
              try {
                await deleteDoc(doc(db, 'usuarios', id));
                setAllUsers((prevList) => prevList.filter((user) => user.id !== id));
                setFilteredUsers((prevList) => prevList.filter((user) => user.id !== id));
                showNotification('success', 'Éxito', 'El usuario ha sido eliminado correctamente.');
              } catch (error: any) {
                showNotification('error', 'Error al eliminar usuario', error.message);
              }
            }}
          >
            Sí, eliminar
          </Button>
          <Button style={{ marginLeft: 8 }} onClick={() => notification.destroy()}>
            Cancelar
          </Button>
        </div>
      ),
    });
  };

  // Asignar ubicación
  const handleAssignLocation = async (ubicacionId: string) => {
    if (!selectedUser) {
      showNotification('error', 'Sin selección', 'Debe seleccionar un usuario.');
      return;
    }
    try {
      const userRef = doc(db, 'usuarios', selectedUser.id);
      let ubicacionesActualizadas = [...selectedUser.ubicacionesAsignadas];

      if (!ubicacionesActualizadas.includes(ubicacionId)) {
        ubicacionesActualizadas.push(ubicacionId);
      }

      await updateDoc(userRef, { ubicacionesAsignadas: ubicacionesActualizadas });

      showNotification('success', 'Asignación actualizada', 'Ubicación asignada correctamente.');
      const usuarioActualizado = {
        ...selectedUser,
        ubicacionesAsignadas: ubicacionesActualizadas,
      };
      setSelectedUser(usuarioActualizado);
      await fetchUsers();
      await fetchUbicaciones();
    } catch (error: any) {
      showNotification('error', 'Error en la asignación', error.message);
    }
  };

  // Desasignar ubicación específica
  const handleRemoveLocation = async (ubicacionId: string) => {
    if (!selectedUser) {
      showNotification('error', 'Sin selección', 'Debe seleccionar un usuario.');
      return;
    }
    try {
      const userRef = doc(db, 'usuarios', selectedUser.id);
      const ubicacionesActualizadas = selectedUser.ubicacionesAsignadas.filter(
        (id) => id !== ubicacionId
      );

      await updateDoc(userRef, { ubicacionesAsignadas: ubicacionesActualizadas });

      const usuarioActualizado = { ...selectedUser, ubicacionesAsignadas: ubicacionesActualizadas };
      setSelectedUser(usuarioActualizado);

      showNotification('success', 'Ubicación removida', 'Ubicación desasignada correctamente.');
      await fetchUsers();
    } catch (error: any) {
      showNotification('error', 'Error al remover ubicación', error.message);
    }
  };

  // Ver ubicaciones asignadas
  const handleViewLocation = (user: User) => {
    setSelectedUser(user);
    setIsLocationModalOpen(true);
  };

  // Buscar usuarios
  const handleSearch = (searchTerm: string) => {
    const filtered = allUsers.filter(
      (user) =>
        user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  // Columnas de la tabla
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
      title: 'Ubicaciones Asignadas',
      dataIndex: 'ubicacionesAsignadas',
      key: 'ubicacionesAsignadas',
      render: (ubicacionesIds: string[], record: User) => {
        const ubicacionesAsignadas = ubicaciones.filter((u) => ubicacionesIds.includes(u.id));
        return (
          <div className="flex items-center gap-2 flex-wrap">
            {ubicacionesAsignadas.length > 0 ? (
              <>
                {ubicacionesAsignadas.slice(0, 2).map((ubicacion) => (
                  <Tag key={ubicacion.id} color="blue" icon={<EnvironmentOutlined />}>
                    {ubicacion.nombre}
                  </Tag>
                ))}
                {ubicacionesAsignadas.length > 2 && (
                  <Tag color="default">+{ubicacionesAsignadas.length - 2} más</Tag>
                )}
              </>
            ) : (
              <Tag color="default">Sin asignar</Tag>
            )}
            {currentUserRole === 'admin' && (
              <Tooltip title="Ver ubicaciones asignadas">
                <Button
                  type="link"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => handleViewLocation(record)}
                  aria-label="Ver ubicaciones asignadas"
                />
              </Tooltip>
            )}
          </div>
        );
      },
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (record: User) => (
        <div className="flex space-x-2">
          {currentUserRole === 'admin' && (
            <>
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
              <Tooltip title="Eliminar usuario">
                <Button
                  type="link"
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(record.id)}
                  aria-label="Eliminar usuario"
                  danger
                />
              </Tooltip>
            </>
          )}
        </div>
      ),
    },
  ];

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

        <div className="flex justify-between items-center mb-6">
          <Input
            placeholder="Buscar por nombre o email"
            className="w-full md:w-1/3"
            onChange={(e) => handleSearch(e.target.value)}
            aria-label="Buscar usuarios por nombre o email"
          />
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
          open={openEditModal}
          onClose={() => setOpenEditModal(false)}
          onSubmit={handleEditUser}
          formData={formData}
          isEditMode={true}
          loading={modalLoading}
        />

        <LocationManagementModal
          open={isLocationModalOpen}
          onClose={() => {
            setIsLocationModalOpen(false);
            setSelectedUser(null);
          }}
          selectedUser={selectedUser}
          ubicaciones={ubicaciones}
          handleAssignLocation={handleAssignLocation}
          handleRemoveLocation={handleRemoveLocation}
          loading={modalLoading}
        />
      </div>
    </div>
  );
};

export default UsersManagement;