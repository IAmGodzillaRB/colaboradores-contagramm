import React, { useState } from 'react';
import { Modal, Card, Button, Tag, Empty, Spin, Table, Switch, Space } from 'antd';
import { EnvironmentOutlined, EyeOutlined } from '@ant-design/icons';
import { Ubicacion } from '../../types/Ubicacion';
import { User } from '../../types/User';
import SearchInput from '../SearchInput';
import LocationMapModal from './LocationMapModal';

interface LocationManagementModalProps {
  open: boolean;
  onClose: () => void;
  selectedUser: User | null;
  ubicaciones: Ubicacion[];
  handleAssignLocation: (ubicacionId: string) => Promise<void>;
  handleRemoveLocation: (ubicacionId: string) => Promise<void>;
  loading: boolean;
}

const LocationManagementModal: React.FC<LocationManagementModalProps> = ({
  open,
  onClose,
  selectedUser,
  ubicaciones,
  handleAssignLocation,
  handleRemoveLocation,
  loading,
}) => {
  const [searchAssigned, setSearchAssigned] = useState<string>('');
  const [searchAvailable, setSearchAvailable] = useState<string>('');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [mapModalOpen, setMapModalOpen] = useState<boolean>(false);
  const [selectedUbicacion, setSelectedUbicacion] = useState<Ubicacion| null>(null);

  // Filtrar ubicaciones asignadas
  const assignedLocations = selectedUser?.ubicacionesAsignadas
    ? ubicaciones.filter(
        (ubicacion) =>
          selectedUser.ubicacionesAsignadas.includes(ubicacion.id) &&
          ubicacion.nombre.toLowerCase().includes(searchAssigned.toLowerCase())
      )
    : [];

  // Filtrar ubicaciones disponibles
  const availableLocations = ubicaciones.filter(
    (ubicacion) =>
      !selectedUser?.ubicacionesAsignadas.includes(ubicacion.id) &&
      ubicacion.nombre.toLowerCase().includes(searchAvailable.toLowerCase())
  );

  // Abrir modal del mapa
  const handleOpenMap = (ubicacion: Ubicacion) => {
    setSelectedUbicacion(ubicacion);
    setMapModalOpen(true);
  };

  // Columnas para la vista de lista
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
      render: (text: string) => text || 'Sin descripción',
    },
    {
      title: 'Coordenadas',
      key: 'coordenadas',
      render: (record: Ubicacion) => `${record.latitud}, ${record.longitud}`,
    },
    {
      title: 'Radio',
      dataIndex: 'radio',
      key: 'radio',
      render: (radio: number) => `${radio} metros`,
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
      key: 'acciones',
      render: (record: Ubicacion) => (
        <Space>
          <Button
            type="primary"
            size="small"
            danger={assignedLocations.includes(record)}
            onClick={() =>
              assignedLocations.includes(record)
                ? handleRemoveLocation(record.id)
                : handleAssignLocation(record.id)
            }
            className={assignedLocations.includes(record) ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}
          >
            {assignedLocations.includes(record) ? 'Remover' : 'Asignar'}
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleOpenMap(record)}
            aria-label="Ver en el mapa"
          >
            Ver en el Mapa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Modal
      title={
        <div className="text-2xl font-semibold text-blue-800">
          {selectedUser ? `Ubicaciones de ${selectedUser.nombre} (${assignedLocations.length} asignadas)` : 'Gestionar Ubicaciones'}
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={
        <Button
          type="primary"
          size="large"
          onClick={onClose}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Cerrar
        </Button>
      }
      width={900}
      className="max-h-[80vh] overflow-y-auto rounded-lg"
      bodyStyle={{ padding: '24px' }}
    >
      <Spin spinning={loading}>
        {/* Sección de ubicaciones asignadas */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-medium text-gray-800">Ubicaciones Asignadas</h3>
            <Space>
              <span>Vista:</span>
              <Switch
                checkedChildren="Lista"
                unCheckedChildren="Tarjetas"
                checked={viewMode === 'list'}
                onChange={(checked) => setViewMode(checked ? 'list' : 'cards')}
              />
            </Space>
          </div>
          <SearchInput
            placeholder="Buscar ubicaciones asignadas por nombre"
            onSearch={setSearchAssigned}
            className="mb-4"
          />
          {assignedLocations.length > 0 ? (
            viewMode === 'cards' ? (
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                {assignedLocations.map((ubicacion) => (
                  <Card
                    key={ubicacion.id}
                    title={
                      <div className="flex items-center text-lg">
                        <EnvironmentOutlined className="text-blue-500 mr-2" />
                        {ubicacion.nombre}
                      </div>
                    }
                    extra={
                      <Space>
                        <Button
                          type="primary"
                          size="small"
                          danger
                          onClick={() => handleRemoveLocation(ubicacion.id)}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          Remover
                        </Button>
                        <Button
                          type="link"
                          size="small"
                          icon={<EyeOutlined />}
                          onClick={() => handleOpenMap(ubicacion)}
                          aria-label="Ver en el mapa"
                        >
                          Ver en el Mapa
                        </Button>
                      </Space>
                    }
                    className="shadow-md hover:shadow-lg transition-shadow"
                  >
                    <p className="text-gray-700">
                      <strong>Descripción:</strong> {ubicacion.descripcion || 'Sin descripción'}
                    </p>
                    <p className="text-gray-700">
                      <strong>Coordenadas:</strong> {ubicacion.latitud}, {ubicacion.longitud}
                    </p>
                    <p className="text-gray-700">
                      <strong>Radio:</strong> {ubicacion.radio} metros
                    </p>
                    <p>
                      <strong>Estado:</strong>{' '}
                      <Tag color={ubicacion.activa ? 'green' : 'red'}>
                        {ubicacion.activa ? 'Activa' : 'Inactiva'}
                      </Tag>
                    </p>
                  </Card>
                ))}
              </div>
            ) : (
              <Table
                dataSource={assignedLocations}
                columns={columns}
                rowKey="id"
                pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] }}
                scroll={{ x: 'max-content' }}
              />
            )
          ) : (
            <Empty
              description={
                searchAssigned
                  ? 'No se encontraron ubicaciones asignadas'
                  : 'No hay ubicaciones asignadas'
              }
              className="py-6 border border-gray-200 rounded-lg"
            />
          )}
        </div>

        {/* Sección de asignar nueva ubicación */}
        <div className="border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-medium text-gray-800">Asignar Nueva Ubicación ({availableLocations.length} disponibles)</h3>
            <Space>
              <span>Vista:</span>
              <Switch
                checkedChildren="Lista"
                unCheckedChildren="Tarjetas"
                checked={viewMode === 'list'}
                onChange={(checked) => setViewMode(checked ? 'list' : 'cards')}
              />
            </Space>
          </div>
          <SearchInput
            placeholder="Buscar ubicaciones disponibles por nombre"
            onSearch={setSearchAvailable}
            className="mb-4"
          />
          {availableLocations.length > 0 ? (
            viewMode === 'cards' ? (
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                {availableLocations.map((ubicacion) => (
                  <Card
                    key={ubicacion.id}
                    title={
                      <div className="flex items-center text-lg">
                        <EnvironmentOutlined className="text-blue-500 mr-2" />
                        {ubicacion.nombre}
                      </div>
                    }
                    extra={
                      <Space>
                        <Button
                          type="primary"
                          size="small"
                          onClick={() => handleAssignLocation(ubicacion.id)}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          Asignar
                        </Button>
                        <Button
                          type="link"
                          size="small"
                          icon={<EyeOutlined />}
                          onClick={() => handleOpenMap(ubicacion)}
                          aria-label="Ver en el mapa"
                        >
                          Ver en el Mapa
                        </Button>
                      </Space>
                    }
                    className="shadow-md hover:shadow-lg transition-shadow"
                  >
                    <p className="text-gray-700">
                      <strong>Descripción:</strong> {ubicacion.descripcion || 'Sin descripción'}
                    </p>
                    <p className="text-gray-700">
                      <strong>Coordenadas:</strong> {ubicacion.latitud}, {ubicacion.longitud}
                    </p>
                    <p className="text-gray-700">
                      <strong>Radio:</strong> {ubicacion.radio} metros
                    </p>
                    <p>
                      <strong>Estado:</strong>{' '}
                      <Tag color={ubicacion.activa ? 'green' : 'red'}>
                        {ubicacion.activa ? 'Activa' : 'Inactiva'}
                      </Tag>
                    </p>
                  </Card>
                ))}
              </div>
            ) : (
              <Table
                dataSource={availableLocations}
                columns={columns}
                rowKey="id"
                pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] }}
                scroll={{ x: 'max-content' }}
              />
            )
          ) : (
            <Empty
              description={
                searchAvailable
                  ? 'No se encontraron ubicaciones disponibles'
                  : 'No hay ubicaciones disponibles para asignar'
              }
              className="py-6 border border-gray-200 rounded-lg"
            />
          )}
        </div>
      </Spin>

      <LocationMapModal
        open={mapModalOpen}
        onClose={() => {
          setMapModalOpen(false);
          setSelectedUbicacion(null);
        }}
        ubicacion={selectedUbicacion}
      />
    </Modal>
  );
};

export default LocationManagementModal;