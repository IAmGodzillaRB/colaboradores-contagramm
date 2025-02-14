import React, { useEffect, useState } from 'react';
import { db, collection, getDocs, doc, query, where, deleteDoc } from '../../service/firebaseConfig';
import { Table, Input, Button, Tooltip, Tag } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined, FileAddOutlined } from '@ant-design/icons';
import Swal from 'sweetalert2';
import { Link } from 'react-router-dom';
import PuestoModal from '../../components/modals/PuestoModal';

// Tipos para los datos de puesto
interface Puesto {
  id: string;
  nombrePuesto: string;
  empleadosCount: number;
}

const Positions: React.FC = () => {
  const [positionsList, setPositionsList] = useState<Puesto[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedPuesto, setSelectedPuesto] = useState<Puesto | null>(null);
  const [pageSize, setPageSize] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(true);// Estado de carga

  const fetchPuestos = async () => {
    setLoading(true);

    const puestosCollection = collection(db, 'puestos');
    const puestosSnapshot = await getDocs(puestosCollection);
    const puestosData: Puesto[] = puestosSnapshot.docs.map((doc) => ({
      id: doc.id,
      nombrePuesto: doc.data().nombrePuesto,
      empleadosCount: 0,
    }));

    const puestosConEmpleados = await Promise.all(
      puestosData.map(async (puesto) => {
        const empleadosQuery = query(
          collection(db, 'colaboradores'),
          where('idPuesto', '==', doc(db, 'puestos', puesto.id))
        );
        const empleadosSnapshot = await getDocs(empleadosQuery);
        return { ...puesto, empleadosCount: empleadosSnapshot.size };
      })
    );

    setPositionsList(puestosConEmpleados);
    setLoading(false); // Finalizar carga
  };

  useEffect(() => {
    fetchPuestos();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const handleEdit = (position: Puesto) => {
    setSelectedPuesto(position);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará el puesto de forma permanente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      await deleteDoc(doc(db, 'puestos', id));
      setPositionsList((prevList) => prevList.filter((puesto) => puesto.id !== id));
      Swal.fire('Eliminado', 'El puesto ha sido eliminado.', 'success');
    }
  };

  const columns = [
    {
      title: 'Puesto',
      dataIndex: 'nombrePuesto',
      key: 'nombrePuesto',
      ellipsis: true,
    },
    {
      title: 'Empleados',
      dataIndex: 'empleadosCount',
      key: 'empleadosCount',
      render: (empleadosCount: number, record: Puesto) => (
        <div className="flex items-center space-x-2">
          <Tag color="blue">{empleadosCount}</Tag>
          <Link to={`/colaboradores?puesto=${record.id}`} className="text-blue-600 hover:text-blue-800 text-sm">
            <EyeOutlined /> Ver
          </Link>
        </div>
      ),
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (record: Puesto) => (
        <div className="flex space-x-2">
          <Tooltip title="Editar puesto">
            <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Tooltip title="Eliminar puesto">
            <Button type="link" icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} danger />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="flex justify-center h-screen bg-gray-100">
      <div className="w-full max-w-7xl px-6 py-8 flex flex-col h-full bg-white shadow-lg rounded-lg">
        <h2 className="text-3xl font-semibold mb-6 text-center text-blue-800">Puestos</h2>

        {/* Buscador y botón de agregar (Ahora Responsive) */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <Input
            placeholder="Buscar por puesto"
            className="w-full md:w-1/3 mb-4 md:mb-0"
            value={searchTerm}
            onChange={handleSearch}
          />
          <Button
            type="primary"
            icon={<FileAddOutlined />}
            className="w-full md:w-auto flex items-center justify-center"
            onClick={() => {
              setSelectedPuesto(null);
              setIsModalOpen(true);
            }}
          >
            <span className="hidden md:block">Agregar Puesto</span>
          </Button>

        </div>

        {/* Tabla con Paginación */}
        <div className="overflow-x-auto flex flex-col h-full">
          <Table
            dataSource={positionsList.filter((p) =>
              !searchTerm || p.nombrePuesto.toLowerCase().includes(searchTerm)
            )}
            columns={columns}
            rowKey="id"
            pagination={{
              pageSize: pageSize,
              showSizeChanger: true,

              pageSizeOptions: ['10', '15', '20'],
              onShowSizeChange: (_, size) => setPageSize(size),
            }}
            bordered
            scroll={{ x: 'max-content' }}
            loading={loading}
          />
        </div>

        {/* Modal para agregar/editar puestos */}
        {isModalOpen && (
          <PuestoModal
            open={isModalOpen}
            isEditMode={!!selectedPuesto}
            puestoData={selectedPuesto || undefined}
            onClose={() => setIsModalOpen(false)}
            onUpdate={fetchPuestos}
          />
        )}
      </div>
    </div>
  );
};

export default Positions;
