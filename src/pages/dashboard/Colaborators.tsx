import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { db, collection, getDocs, deleteDoc, doc, getDoc } from '../../service/firebaseConfig';
import { Table, Input, Button, Tag, Tooltip, notification } from 'antd';
import { EditOutlined, DeleteOutlined, FileExcelOutlined } from '@ant-design/icons';
import Swal from 'sweetalert2';
import ColaboradorModal from '../../components/modals/CollaboratorModal';
import * as XLSX from 'xlsx';
import { DocumentData, DocumentReference } from 'firebase/firestore';
import type { ColumnsType } from 'antd/es/table';

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

// Función utilitaria para mostrar notificaciones
const showNotification = (type: 'success' | 'error', message: string, description?: string) => {
  notification[type]({
    message,
    description,
  });
};

// Componente reutilizable para botones de acción
const ActionButton: React.FC<{
  icon: React.ReactNode;
  onClick: () => void;
  tooltip: string;
  ariaLabel: string;
  danger?: boolean;
}> = ({ icon, onClick, tooltip, ariaLabel, danger }) => (
  <Tooltip title={tooltip}>
    <Button
      type="link"
      icon={icon}
      onClick={onClick}
      danger={danger}
      aria-label={ariaLabel}
    />
  </Tooltip>
);

const Colaborators: React.FC = () => {
  const [collaboratorsList, setCollaboratorsList] = useState<Collaborator[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [puestosMap, setPuestosMap] = useState<{ [key: string]: string }>({});
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCollaborator, setSelectedCollaborator] = useState<Collaborator | null>(null);
  const [selectedPuesto] = useState<string>('');
  const [selectedEstatus] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<number>(10);

  // Obtener colaboradores con manejo de errores
  const fetchCollaborators = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const collaboratorsCollection = collection(db, 'colaboradores');
      const collaboratorsSnapshot = await getDocs(collaboratorsCollection);

      const collaboratorsData = await Promise.all(
        collaboratorsSnapshot.docs.map(async (doc) => {
          const data = doc.data();
          let nombrePuesto = 'Desconocido';

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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      showNotification('error', 'Error al cargar colaboradores', errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener puestos con manejo de errores
  const fetchPuestos = useCallback(async () => {
    try {
      const puestosCollection = collection(db, 'puestos');
      const puestosSnapshot = await getDocs(puestosCollection);

      const puestosData: { [key: string]: string } = {};
      puestosSnapshot.forEach((doc) => {
        puestosData[doc.id] = doc.data().nombrePuesto;
      });

      setPuestosMap(puestosData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      showNotification('error', 'Error al cargar puestos', errorMessage);
    }
  }, []);

  // Eliminar colaborador con mejor manejo de errores
  const handleDelete = async (id: string) => {
    try {
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
        showNotification('success', 'Éxito', 'El colaborador ha sido eliminado correctamente.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      showNotification('error', 'Error al eliminar', errorMessage);
    }
  };

  // Exportar a Excel con manejo de errores
  const handleExportToExcel = () => {
    try {
      const collaboratorsFiltered = collaboratorsList.map(({ id, idPuesto, ...rest }) => rest);

      const worksheet = XLSX.utils.json_to_sheet(collaboratorsFiltered);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Colaboradores');

      XLSX.writeFile(workbook, 'colaboradores.xlsx');

      showNotification('success', 'Exportación exitosa', 'Los datos han sido exportados a Excel correctamente.');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      showNotification('error', 'Error al exportar', errorMessage);
    }
  };

  // Filtrar colaboradores con memoización para mejorar rendimiento
  const filteredCollaborators = useMemo(() => {
    return collaboratorsList.filter(
      (collaborator) =>
        (!searchTerm ||
          (collaborator.nombre && collaborator.nombre.toLowerCase().includes(searchTerm)) ||
          (collaborator.idColaborador && collaborator.idColaborador.toLowerCase().includes(searchTerm))) &&
        (!selectedPuesto || collaborator.idPuesto === selectedPuesto) &&
        (selectedEstatus === null || collaborator.estatus === selectedEstatus)
    );
  }, [collaboratorsList, searchTerm, selectedPuesto, selectedEstatus]);

  // Columnas de la tabla con componentes reutilizables
  const columns: ColumnsType<Collaborator> = useMemo(() => [
    {
      title: 'ID Colaborador',
      dataIndex: 'idColaborador',
      key: 'idColaborador',
    },
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      render: (text: string) => text,
    },
    {
      title: 'Puesto',
      dataIndex: 'nombrePuesto',
      key: 'nombrePuesto',
      filters: Object.values(puestosMap).map((nombrePuesto) => ({
        text: nombrePuesto,
        value: nombrePuesto,
      })),
      onFilter: (value: string | number | boolean | React.Key, record: Collaborator) => {
        // Asegúrate de que el valor sea un string
        if (typeof value === 'string') {
          return record.nombrePuesto === value;
        }
        return false;
      },
    },
    {
      title: 'Estatus',
      dataIndex: 'estatus',
      key: 'estatus',
      render: (estatus: boolean) => (
        <Tag color={estatus ? 'green' : 'red'} aria-label={estatus ? 'Activo' : 'Inactivo'}>
          {estatus ? 'Activo' : 'Inactivo'}
        </Tag>
      ),
      filters: [
        { text: 'Activo', value: true },
        { text: 'Inactivo', value: false },
      ],
      onFilter: (value: boolean | React.Key, record: Collaborator) => {
        // Asegúrate de que el valor sea un booleano
        if (typeof value === 'boolean') {
          return record.estatus === value;
        }
        return false;
      },
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (record: Collaborator) => (
        <div className="flex space-x-2">
          <ActionButton
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedCollaborator(record);
              setIsModalOpen(true);
            }}
            tooltip="Editar colaborador"
            ariaLabel="Editar colaborador"
          />
          <ActionButton
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
            tooltip="Eliminar colaborador"
            ariaLabel="Eliminar colaborador"
            danger
          />
        </div>
      ),
    },
  ], [puestosMap]);

  useEffect(() => {
    fetchCollaborators();
    fetchPuestos();
  }, [fetchCollaborators, fetchPuestos]);

  return (
    <div className="flex justify-center h-screen bg-gray-100">
      <div className="w-full px-6 py-8 flex flex-col h-full bg-white shadow-lg rounded-lg">
        <h2 className="text-3xl font-semibold mb-6 text-center text-blue-800">Lista de Colaboradores</h2>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <Input
            placeholder="Buscar por nombre o ID"
            className="w-full md:w-1/3"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
            aria-label="Buscar colaboradores por nombre o ID"
          />
          <div className="flex space-x-2 mt-4 md:mt-0">
            {/* Botón "Ver Excel" */}
            <Button
              style={{
                backgroundColor: '#28a745',
                borderColor: '#28a745',
                color: 'white',
              }}
              icon={<FileExcelOutlined />}
              onClick={handleExportToExcel}
              aria-label="Exportar a Excel"
              className="p-2 sm:px-4 sm:py-2 flex items-center justify-center"
            >
              <span className="hidden sm:inline">Ver Excel</span> {/* Texto visible solo en desktop */}
            </Button>

            {/* Botón "Agregar Colaborador" */}
            <Button
              type="primary"
              onClick={() => {
                setSelectedCollaborator(null);
                setIsModalOpen(true);
              }}
              aria-label="Agregar nuevo colaborador"
              className="p-2 sm:px-4 sm:py-2 flex items-center justify-center"
            >
              <span className="hidden sm:inline">+ Agregar Colaborador</span> {/* Texto visible solo en desktop */}
              <span className="sm:hidden">+</span> {/* Solo muestra "+" en móvil */}
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto flex flex-col h-full">
          <Table
            dataSource={filteredCollaborators}
            columns={columns}
            rowKey="id"
            pagination={{
              pageSize,
              showSizeChanger: true,
              pageSizeOptions: ['10', '15', '20'],
              onShowSizeChange: (_, size) => setPageSize(size),
            }}
            bordered
            scroll={{ x: 'max-content' }}
            loading={loading}
            className="w-full"
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
    </div>
  );
};

export default Colaborators;