import React, { useState, useEffect, useCallback } from 'react';
import { db, collection, addDoc, getDocs, updateDoc, doc, deleteDoc } from '../../service/firebaseConfig';
import { Table, Button, notification, Modal, Form, Input, InputNumber, Space, Tag } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import LocationMap from '../../components/LocationMap';
import { Ubicacion } from '../../types/Ubicacion'; // Ajusta el path si es necesario

const LocationManagement: React.FC = () => {
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [form] = Form.useForm();
  const [editingUbicacion, setEditingUbicacion] = useState<Ubicacion | null>(null);

  // Obtener Ubicaciones
  const fetchUbicaciones = useCallback(async () => {
    try {
      setLoading(true);
      const ubicacionesCollection = collection(db, 'ubicaciones');
      const ubicacionesSnapshot = await getDocs(ubicacionesCollection);
      const ubicacionesData: Ubicacion[] = ubicacionesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data() as Omit<Ubicacion, 'id'>,
      }));
      setUbicaciones(ubicacionesData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      showNotification('error', 'Error al cargar Ubicaciones', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    fetchUbicaciones();
  }, [fetchUbicaciones]);

  const showNotification = (type: 'success' | 'error', message: string, description?: string) => {
    notification[type]({
      message,
      description,
    });
  };

  // Crear o editar ubicación
  const handleCreateOrUpdateLocation = async (values: any) => {
    try {
      const Ubicacion: Omit<Ubicacion, 'id'> = {
        nombre: values.nombre,
        descripcion: values.descripcion || '',
        latitud: values.latitud,
        longitud: values.longitud,
        radio: values.radio || 10,
        activa: editingUbicacion ? editingUbicacion.activa : true,
      };

      if (editingUbicacion) {
        // Editar ubicación existente
        await updateDoc(doc(db, 'ubicaciones', editingUbicacion.id), Ubicacion);
        showNotification('success', 'Ubicación actualizada', 'La ubicación ha sido actualizada correctamente.');
      } else {
        // Crear nueva ubicación
        await addDoc(collection(db, 'ubicaciones'), Ubicacion);
        showNotification('success', 'Ubicación creada', 'La nueva ubicación ha sido creada correctamente.');
      }

      await fetchUbicaciones();
      setIsModalOpen(false);
      setEditingUbicacion(null);
      form.resetFields();
    } catch (error: any) {
      showNotification('error', editingUbicacion ? 'Error al actualizar ubicación' : 'Error al crear ubicación', error.message);
    }
  };

  // Eliminar ubicación
  const handleDelete = async (id: string) => {
    notification.warning({
      message: '¿Estás seguro?',
      description: 'Esta acción eliminará la ubicación de forma permanente.',
      duration: 0,
      btn: (
        <div>
          <Button
            type="primary"
            danger
            onClick={async () => {
              notification.destroy();
              try {
                await deleteDoc(doc(db, 'Ubicaciones', id));
                setUbicaciones((prevList) => prevList.filter((Ubicacion) => Ubicacion.id !== id));
                showNotification('success', 'Éxito', 'La ubicación ha sido eliminada correctamente.');
              } catch (error: any) {
                showNotification('error', 'Error al eliminar ubicación', error.message);
              }
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

  // Columnas de la tabla
  const columns = [
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
    },
    {
      title: 'Descripción',
      dataIndex: 'descripcion',
      key: 'descripcion',
    },
    {
      title: 'Coordenadas',
      key: 'coordenadas',
      render: (record: Ubicacion) => `${record.latitud}, ${record.longitud}`,
    },
    {
      title: 'Radio (m)',
      dataIndex: 'radio',
      key: 'radio',
    },
    {
      title: 'Estado',
      dataIndex: 'activa',
      key: 'activa',
      render: (activa: boolean) => (
        <Tag color={activa ? 'green' : 'red'}>{activa ? 'Activa' : 'Inactiva'}</Tag>
      ),
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (record: Ubicacion) => (
        <div className="flex space-x-2">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingUbicacion(record);
              form.setFieldsValue({
                nombre: record.nombre,
                descripcion: record.descripcion,
                latitud: record.latitud,
                longitud: record.longitud,
                radio: record.radio,
              });
              setIsModalOpen(true);
            }}
            aria-label="Editar ubicación"
          />
          <Button
            type="link"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
            aria-label="Eliminar ubicación"
            danger
          />
        </div>
      ),
    },
  ];

  return (
    <div className="flex justify-center h-screen bg-gray-100">
      <div className="w-full px-6 py-8 flex flex-col h-full bg-white shadow-lg rounded-lg">
        <h2 className="text-3xl font-semibold mb-6 text-center text-blue-800">Gestión de Ubicaciones</h2>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        <div className="flex justify-end mb-6">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingUbicacion(null);
              form.resetFields();
              setIsModalOpen(true);
            }}
            aria-label="Agregar nueva ubicación"
          >
            Agregar Ubicación
          </Button>
        </div>

        <Table
          dataSource={ubicaciones}
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

        <Modal
          title={editingUbicacion ? 'Editar Ubicación' : 'Crear Nueva Ubicación'}
          open={isModalOpen}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingUbicacion(null);
            form.resetFields();
          }}
          footer={null}
          width={800}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleCreateOrUpdateLocation}
          >
            <Form.Item
              name="nombre"
              label="Nombre de la Ubicación"
              rules={[{ required: true, message: 'Ingrese el nombre de la ubicación' }]}
            >
              <Input placeholder="Ej: Oficina Principal" />
            </Form.Item>
            <Form.Item
              name="descripcion"
              label="Descripción"
            >
              <Input.TextArea placeholder="Descripción opcional de la ubicación" />
            </Form.Item>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="latitud"
                label="Latitud"
                rules={[{ required: true, message: 'Ingrese la latitud' }]}
              >
                <InputNumber
                  placeholder="17.072036"
                  step={0.000001}
                  precision={6}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item
                name="longitud"
                label="Longitud"
                rules={[{ required: true, message: 'Ingrese la longitud' }]}
              >
                <InputNumber
                  placeholder="-96.759780"
                  step={0.000001}
                  precision={6}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </div>
            <Form.Item
              name="radio"
              label="Radio de Verificación (metros)"
              initialValue={10}
            >
              <InputNumber
                min={5}
                max={100}
                placeholder="10"
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  {editingUbicacion ? 'Actualizar Ubicación' : 'Crear Ubicación'}
                </Button>
                <Button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingUbicacion(null);
                    form.resetFields();
                  }}
                >
                  Cancelar
                </Button>
              </Space>
            </Form.Item>
          </Form>
          <LocationMap
            onLocationSelect={(lat, lng) => {
              return form.setFieldsValue({ latitud: lat, longitud: lng });
            }}
            initialPosition={{
              lat: form.getFieldValue('latitud') || 17.072036983980418,
              lng: form.getFieldValue('longitud') || -96.75978056140424,
            }}
            assignedLocation={editingUbicacion ? {
              lat: editingUbicacion.latitud,
              lng: editingUbicacion.longitud,
              radius: editingUbicacion.radio,
              name: editingUbicacion.nombre,
            } : undefined}
          />
        </Modal>
      </div>
    </div>
  );
};

export default LocationManagement;