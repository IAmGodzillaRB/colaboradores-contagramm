import React, { useState, useEffect, useCallback } from 'react';
import { Table, DatePicker, Select, Card, Tag, Button, notification } from 'antd';
import { FilterOutlined, ReloadOutlined, FileExcelOutlined } from '@ant-design/icons';
import { db, collection, getDocs, query, where, getDoc, doc } from '../../service/firebaseConfig';
import { Timestamp } from 'firebase/firestore';
import { RegistroAsistencia } from '../../types/RegistroAsistencia';
import { Ubicacion } from '../../types/Ubicacion';
import { User } from '../../types/User';
import dayjs, { Dayjs } from 'dayjs';
import { Clock } from 'lucide-react';
import * as XLSX from 'xlsx';

const { Option } = Select;

interface ExpandedAsistenciaData extends RegistroAsistencia {
  userData?: User;
  ubicacionData?: Ubicacion;
}

interface GroupedAsistencia {
  key: string;
  userId: string;
  userName: string;
  date: string;
  entrada?: { time: Date; ubicacionNombre: string };
  inicioComida?: { time: Date; ubicacionNombre: string };
  finComida?: { time: Date; ubicacionNombre: string };
  salida?: { time: Date; ubicacionNombre: string };
  ubicacionData?: Ubicacion;
  records: ExpandedAsistenciaData[];
}

const AsistenciasAdmin: React.FC = () => {
  const [groupedAsistencias, setGroupedAsistencias] = useState<GroupedAsistencia[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({
    mes: dayjs() as Dayjs | null,
    dia: dayjs() as Dayjs | null,
    userId: undefined as string | undefined,
    tipo: undefined as 'entrada' | 'comida' | 'salida' | undefined,
  });
  const [users, setUsers] = useState<User[]>([]);

  // Fetch asistencias with filters
  const fetchAsistencias = useCallback(async () => {
    try {
      setLoading(true);

      if (!filters.mes) {
        notification.error({
          message: 'Error',
          description: 'Por favor selecciona un mes para filtrar.',
        });
        return;
      }

      // Definir el rango de fechas: día específico o mes completo
      const startDate = filters.dia
        ? Timestamp.fromDate(filters.dia.startOf('day').toDate())
        : Timestamp.fromDate(filters.mes.startOf('month').toDate());
      const endDate = filters.dia
        ? Timestamp.fromDate(filters.dia.endOf('day').toDate())
        : Timestamp.fromDate(filters.mes.endOf('month').toDate());

      let q = query(
        collection(db, 'registros_asistencia'),
        where('timestamp', '>=', startDate),
        where('timestamp', '<=', endDate)
      );

      if (filters.userId) {
        q = query(q, where('userId', '==', filters.userId));
      }
      if (filters.tipo) {
        q = query(q, where('tipo', '==', filters.tipo));
      }

      const querySnapshot = await getDocs(q);
      const asistenciaData: ExpandedAsistenciaData[] = [];

      const promises = querySnapshot.docs.map(async (asistenciaDoc) => {
        const data = asistenciaDoc.data() as RegistroAsistencia;
        const userDoc = await getDoc(doc(db, 'usuarios', data.userId));
        const userData = userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } as User : undefined;
        const ubicacionDoc = await getDoc(doc(db, 'ubicaciones', data.ubicacionId));
        const ubicacionData = ubicacionDoc.exists()
          ? { id: ubicacionDoc.id, ...ubicacionDoc.data() } as Ubicacion
          : undefined;

        return {
          id: asistenciaDoc.id,
          ...data,
          userData,
          ubicacionData,
          timestamp: (data.timestamp as Timestamp).toDate(),
        };
      });

      const results = await Promise.all(promises);
      asistenciaData.push(...results);

      // Agrupar por usuario y día
      const groupedData: { [key: string]: GroupedAsistencia } = {};
      asistenciaData.forEach((record) => {
        const date = dayjs(record.timestamp).format('YYYY-MM-DD');
        const key = `${record.userId}-${date}`;
        if (!groupedData[key]) {
          groupedData[key] = {
            key,
            userId: record.userId,
            userName: record.userData?.nombre || 'Usuario no encontrado',
            date,
            records: [],
            ubicacionData: record.ubicacionData,
          };
        }
        groupedData[key].records.push(record);
        const ubicacionNombre = record.ubicacionData?.nombre || 'Ubicación no encontrada';
        if (record.tipo === 'entrada') {
          groupedData[key].entrada = { time: record.timestamp, ubicacionNombre };
        }
        if (record.tipo === 'comida' && record.subtipo === 'inicio') {
          groupedData[key].inicioComida = { time: record.timestamp, ubicacionNombre };
        }
        if (record.tipo === 'comida' && record.subtipo === 'fin') {
          groupedData[key].finComida = { time: record.timestamp, ubicacionNombre };
        }
        if (record.tipo === 'salida') {
          groupedData[key].salida = { time: record.timestamp, ubicacionNombre };
        }
      });

      setGroupedAsistencias(Object.values(groupedData));
      setPagination((prev) => ({ ...prev, total: Object.values(groupedData).length }));
    } catch (error) {
      notification.error({
        message: 'Error',
        description: 'No se pudieron cargar los registros de asistencia',
      });
      console.error('Error fetching asistencias:', error);
    } finally {
      setLoading(false);
    }
  }, [filters.mes, filters.dia, filters.userId, filters.tipo]);

  // Fetch users for filter
  const fetchUsers = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'usuarios'));
      const usersData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, []);

  // Apply filters
  const handleFilter = () => {
    setFilterLoading(true);
    fetchAsistencias().finally(() => setFilterLoading(false));
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      mes: dayjs(),
      dia: dayjs(),
      userId: undefined,
      tipo: undefined,
    });
  };

  // Export to Excel
  const exportToExcel = () => {
    const data = groupedAsistencias.map((record) => ({
      Usuario: record.userName,
      Fecha: dayjs(record.date).format('DD/MM/YYYY'),
      Entrada: record.entrada
        ? `${record.entrada.ubicacionNombre} ${dayjs(record.entrada.time).format('HH:mm')} (${
            dayjs(record.entrada.time).isAfter(dayjs(record.entrada.time).set('hour', 9).set('minute', 10))
              ? 'Retardo'
              : 'Aceptada'
          })`
        : 'N/A',
      'Inicio Comida': record.inicioComida
        ? `${record.inicioComida.ubicacionNombre} ${dayjs(record.inicioComida.time).format('HH:mm')}`
        : 'N/A',
      'Fin Comida': record.finComida
        ? `${record.finComida.ubicacionNombre} ${dayjs(record.finComida.time).format('HH:mm')}`
        : 'N/A',
      Salida: record.salida
        ? `${record.salida.ubicacionNombre} ${dayjs(record.salida.time).format('HH:mm')}`
        : 'N/A',
      Ubicación: record.ubicacionData?.nombre || 'Ubicación no encontrada',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Asistencias');
    XLSX.writeFile(workbook, `asistencias_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`);
  };

  // Table columns
  const columns = [
    {
      title: 'Usuario',
      dataIndex: 'userName',
      key: 'userName',
      sorter: (a: GroupedAsistencia, b: GroupedAsistencia) => a.userName.localeCompare(b.userName),
      render: (userName: string) => (
        <span className="font-medium text-gray-800">{userName}</span>
      ),
    },
    {
      title: 'Fecha',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => (
        <span className="text-gray-600">{dayjs(date).format('DD/MM/YYYY')}</span>
      ),
      sorter: (a: GroupedAsistencia, b: GroupedAsistencia) => dayjs(a.date).diff(dayjs(b.date)),
    },
    {
      title: 'Entrada',
      dataIndex: 'entrada',
      key: 'entrada',
      render: (entrada?: { time: Date; ubicacionNombre: string }) => {
        if (!entrada) return <span className="text-gray-400">N/A</span>;
        const isLate = dayjs(entrada.time).isAfter(dayjs(entrada.time).set('hour', 9).set('minute', 10));
        return (
          <div className="flex flex-col">
            <span className="text-blue-600 font-medium">{entrada.ubicacionNombre}</span>
            <span className="text-gray-600">{dayjs(entrada.time).format('HH:mm')}</span>
            <Tag color={isLate ? 'orange' : 'green'} className="mt-1">
              {isLate ? 'Retardo' : 'Aceptada'}
            </Tag>
          </div>
        );
      },
      sorter: (a: GroupedAsistencia, b: GroupedAsistencia) =>
        (a.entrada?.time.getTime() || 0) - (b.entrada?.time.getTime() || 0),
    },
    {
      title: 'Inicio Comida',
      dataIndex: 'inicioComida',
      key: 'inicioComida',
      render: (inicioComida?: { time: Date; ubicacionNombre: string }) => (
        <div className="flex flex-col">
          <span className="text-orange-600 font-medium">{inicioComida ? inicioComida.ubicacionNombre : 'N/A'}</span>
          <span className="text-gray-600">{inicioComida ? dayjs(inicioComida.time).format('HH:mm') : '-'}</span>
        </div>
      ),
      sorter: (a: GroupedAsistencia, b: GroupedAsistencia) =>
        (a.inicioComida?.time.getTime() || 0) - (b.inicioComida?.time.getTime() || 0),
    },
    {
      title: 'Fin Comida',
      dataIndex: 'finComida',
      key: 'finComida',
      render: (finComida?: { time: Date; ubicacionNombre: string }) => (
        <div className="flex flex-col">
          <span className="text-orange-600 font-medium">{finComida ? finComida.ubicacionNombre : 'N/A'}</span>
          <span className="text-gray-600">{finComida ? dayjs(finComida.time).format('HH:mm') : '-'}</span>
        </div>
      ),
      sorter: (a: GroupedAsistencia, b: GroupedAsistencia) =>
        (a.finComida?.time.getTime() || 0) - (b.finComida?.time.getTime() || 0),
    },
    {
      title: 'Salida',
      dataIndex: 'salida',
      key: 'salida',
      render: (salida?: { time: Date; ubicacionNombre: string }) => (
        <div className="flex flex-col">
          <span className="text-red-600 font-medium">{salida ? salida.ubicacionNombre : 'N/A'}</span>
          <span className="text-gray-600">{salida ? dayjs(salida.time).format('HH:mm') : '-'}</span>
        </div>
      ),
      sorter: (a: GroupedAsistencia, b: GroupedAsistencia) =>
        (a.salida?.time.getTime() || 0) - (b.salida?.time.getTime() || 0),
    },
    {
      title: 'Ubicación',
      dataIndex: 'ubicacionData',
      key: 'ubicacion',
      render: (ubicacionData?: Ubicacion) => (
        <span className="text-gray-600">{ubicacionData ? ubicacionData.nombre : 'Ubicación no encontrada'}</span>
      ),
      sorter: (a: GroupedAsistencia, b: GroupedAsistencia) => {
        const nameA = a.ubicacionData ? a.ubicacionData.nombre : '';
        const nameB = b.ubicacionData ? b.ubicacionData.nombre : '';
        return nameA.localeCompare(nameB);
      },
    },
  ];

  // Initial data fetch
  useEffect(() => {
    fetchUsers();
    fetchAsistencias();
  }, [fetchUsers]);

  // Fetch asistencias when filters change
  useEffect(() => {
    if (filters.mes) {
      handleFilter();
    }
  }, [filters.mes, filters.dia, filters.userId, filters.tipo]);

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center space-x-2">
          <Clock className="w-8 h-8 text-blue-600" />
          <span>Registros de Asistencia</span>
        </h1>

        {/* Filtros y Tabla en un solo Card */}
        <Card className="shadow-lg rounded-xl border border-gray-100">
          <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Revisar Día</label>
                <DatePicker
                  format="DD/MM/YYYY"
                  value={filters.dia}
                  onChange={(date) => setFilters({ ...filters, dia: date, mes: date ? date : filters.mes })}
                  className="w-40 border-gray-300 rounded-md shadow-sm"
                  allowClear={false}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mes</label>
                <DatePicker
                  picker="month"
                  format="MM/YYYY"
                  value={filters.mes}
                  onChange={(date) => setFilters({ ...filters, mes: date, dia: null })}
                  className="w-40 border-gray-300 rounded-md shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                <Select
                  allowClear
                  placeholder="Todos los usuarios"
                  className="w-52"
                  value={filters.userId}
                  onChange={(value) => setFilters({ ...filters, userId: value })}
                >
                  {users.map((user) => (
                    <Option key={user.id} value={user.id}>
                      {user.nombre}
                    </Option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <Select
                  allowClear
                  placeholder="Todos los tipos"
                  className="w-40"
                  value={filters.tipo}
                  onChange={(value) => setFilters({ ...filters, tipo: value })}
                >
                  <Option value="entrada">Entrada</Option>
                  <Option value="comida">Comida</Option>
                  <Option value="salida">Salida</Option>
                </Select>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                icon={<ReloadOutlined />}
                onClick={resetFilters}
                className="border-gray-300 hover:bg-gray-100 rounded-md"
              >
                Limpiar
              </Button>
              <Button
                type="primary"
                icon={<FilterOutlined />}
                loading={filterLoading}
                onClick={handleFilter}
                className="bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                Filtrar
              </Button>
              <Button
                icon={<FileExcelOutlined />}
                onClick={exportToExcel}
                className="bg-green-600 hover:bg-green-700 text-white rounded-md"
              >
                Exportar a Excel
              </Button>
            </div>
          </div>

          {/* Tabla */}
          <Table
            columns={columns}
            dataSource={groupedAsistencias}
            rowKey="key"
            loading={loading}
            pagination={pagination}
            onChange={(pagination) => setPagination(pagination as any)}
            scroll={{ x: true }}
            bordered
            className="rounded-lg"
          />
        </Card>
      </div>
    </div>
  );
};

export default AsistenciasAdmin;