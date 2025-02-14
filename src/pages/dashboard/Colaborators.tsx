import React, { useEffect, useState } from 'react';
import { db, collection, getDocs, deleteDoc, doc, getDoc } from '../../service/firebaseConfig';
import { Table, Input, Button, Select, Tag, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, DownloadOutlined } from '@ant-design/icons';
import Swal from 'sweetalert2';
import ColaboradorModal from '../../components/modals/CollaboratorModal';
import * as XLSX from 'xlsx';
import { DocumentData, DocumentReference } from 'firebase/firestore';

type Collaborator = {
  id: string;
  idColaborador: string;
  nombre: string;
  nombrePuesto: string;
  estatus: boolean;
  idPuesto: string;
};

type Puesto = {
  nombrePuesto: string;
};

const Colaborators: React.FC = () => {
  // Estados
  const [collaboratorsList, setCollaboratorsList] = useState<Collaborator[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [puestosMap, setPuestosMap] = useState<{ [key: string]: string }>({});
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCollaborator, setSelectedCollaborator] = useState<Collaborator | null>(null);
  const [selectedPuesto, setSelectedPuesto] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Obtener colaboradores
  const fetchCollaborators = async () => {
    setLoading(true);
    const collaboratorsCollection = collection(db, 'colaboradores');
    const collaboratorsSnapshot = await getDocs(collaboratorsCollection);

    const collaboratorsData = await Promise.all(
      collaboratorsSnapshot.docs.map(async (doc) => {
        const data = doc.data();
        let nombrePuesto = 'Desconocido';

        // Verificar si idPuesto es una referencia válida
        if (data.idPuesto && typeof data.idPuesto === 'object' && 'path' in data.idPuesto) {
          try {
            const puestoDoc = await getDoc(data.idPuesto as DocumentReference<DocumentData>);
            if (puestoDoc.exists()) {
              const puestoData = puestoDoc.data() as Puesto;
              nombrePuesto = puestoData.nombrePuesto || 'Desconocido';
            }
          } catch (error) {
            console.error('Error fetching puesto:', error);
          }
        }

        return {
          id: doc.id,
          idColaborador: data.idColaborador,
          nombre: data.nombre,
          idPuesto: data.idPuesto?.id || '',
          estatus: data.estatus,
          nombrePuesto,
        };
      })
    );

    setCollaboratorsList(collaboratorsData);
    setLoading(false);
  };

  // Obtener puestos
  const fetchPuestos = async () => {
    const puestosCollection = collection(db, 'puestos');
    const puestosSnapshot = await getDocs(puestosCollection);

    const puestosData: { [key: string]: string } = {};
    puestosSnapshot.forEach((doc) => {
      puestosData[doc.id] = doc.data().nombrePuesto;
    });

    setPuestosMap(puestosData);
  };

  // Eliminar colaborador
  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará al colaborador de forma permanente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      await deleteDoc(doc(db, 'colaboradores', id));
      setCollaboratorsList((prevList) => prevList.filter((collaborator) => collaborator.id !== id));
      Swal.fire('Eliminado', 'El colaborador ha sido eliminado.', 'success');
    }
  };

  // Editar colaborador
  const handleEdit = (collaborator: Collaborator) => {
    setSelectedCollaborator(collaborator);
    setIsModalOpen(true);
  };

  // Cambiar filtro de puesto
  const handlePuestoChange = (value: string) => {
    setSelectedPuesto(value);
  };

  // Buscar por nombre
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  // Exportar a Excel
  const handleExportToExcel = () => {
    const collaboratorsFiltered = collaboratorsList.map(({ id, idPuesto, ...rest }) => rest);

    const worksheet = XLSX.utils.json_to_sheet(collaboratorsFiltered);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Colaboradores');

    XLSX.writeFile(workbook, 'colaboradores.xlsx');
  };

  // Filtrar colaboradores
  const filteredCollaborators = collaboratorsList.filter(
    (collaborator) =>
      (!searchTerm || (collaborator.nombre && collaborator.nombre.toLowerCase().includes(searchTerm))) &&
      (!selectedPuesto || collaborator.idPuesto === selectedPuesto)
  );

  // Columnas de la tabla con filtros
  const columns = [
    {
      title: 'ID Colaborador',
      dataIndex: 'idColaborador',
      key: 'idColaborador',
      // Filtro para ID Colaborador
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Buscar ID"
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={confirm}
            style={{ width: 188, marginBottom: 8, display: 'block' }}
          />
          <Button
            type="primary"
            onClick={confirm}
            size="small"
            style={{ width: 90 }}
          >
            Buscar
          </Button>
        </div>
      ),
      onFilter: (value: string, record: Collaborator) =>
        record.idColaborador.toLowerCase().includes(value.toLowerCase()),
    },
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      // Filtro para Nombre
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Buscar nombre"
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={confirm}
            style={{ width: 188, marginBottom: 8, display: 'block' }}
          />
          <Button
            type="primary"
            onClick={confirm}
            size="small"
            style={{ width: 90 }}
          >
            Buscar
          </Button>
        </div>
      ),
      onFilter: (value: string, record: Collaborator) =>
        record.nombre.toLowerCase().includes(value.toLowerCase()),
    },
    {
      title: 'Puesto',
      dataIndex: 'nombrePuesto',
      key: 'nombrePuesto',
      // Filtro para Puesto
      filters: Object.values(puestosMap).map((nombrePuesto) => ({
        text: nombrePuesto,
        value: nombrePuesto,
      })),
      onFilter: (value: string, record: Collaborator) => record.nombrePuesto === value,
    },
    {
      title: 'Estatus',
      dataIndex: 'estatus',
      key: 'estatus',
      render: (estatus: boolean) => (
        <Tag color={estatus ? 'green' : 'red'}>
          {estatus ? 'Activo' : 'Inactivo'}
        </Tag>
      ),
      // Filtro para Estatus
      filters: [
        { text: 'Activo', value: true },
        { text: 'Inactivo', value: false },
      ],
      onFilter: (value: boolean, record: Collaborator) => record.estatus === value,
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (record: Collaborator) => (
        <div className="flex space-x-2">
          <Tooltip title="Editar colaborador">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Eliminar colaborador">
            <Button
              type="link"
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
              danger
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  // Efecto para cargar datos
  useEffect(() => {
    const fetchData = async () => {
      await fetchPuestos();
      await fetchCollaborators();
    };
    fetchData();
  }, []);

  return (
    <div className="flex justify-center h-screen bg-gray-100">
      <div className="w-full max-w-7xl px-6 py-8 flex flex-col h-full bg-white shadow-lg rounded-lg">
        <h2 className="text-3xl font-semibold mb-6 text-center text-blue-800">
          Lista de Colaboradores
        </h2>
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0 md:space-x-4">
          <Input
            placeholder="Buscar por nombre"
            className="w-full md:w-1/3"
            value={searchTerm}
            onChange={handleSearch}
          />
          <Select
            placeholder="Todos los puestos"
            className="w-full md:w-1/3"
            value={selectedPuesto}
            onChange={handlePuestoChange}
          >
            <Select.Option value="">Todos los puestos</Select.Option>
            {Object.entries(puestosMap).map(([id, nombrePuesto]) => (
              <Select.Option key={id} value={id}>
                {nombrePuesto}
              </Select.Option>
            ))}
          </Select>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExportToExcel}
          >
            Descargar Excel
          </Button>
          <Button
            type="primary"
            onClick={() => {
              setSelectedCollaborator(null);
              setIsModalOpen(true);
            }}
          >
            + Agregar Colaborador
          </Button>
        </div>
        <Table
          dataSource={filteredCollaborators}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: true, pageSizeOptions: ['10', '20', '50', '100'] }}
          bordered
        />
        {isModalOpen && (
          <ColaboradorModal
            open={isModalOpen}
            isEditMode={!!selectedCollaborator}
            collaboratorData={selectedCollaborator || undefined}
            onClose={() => setIsModalOpen(false)}
            onUpdate={fetchCollaborators}
          />
        )}
      </div>
    </div>
  );
};

export default Colaborators;