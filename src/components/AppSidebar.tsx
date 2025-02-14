import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  BankOutlined,
  UserOutlined,
  UploadOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const AppSidebar: React.FC = () => {
  const { user, logout } = useAuth(); // Obtén el usuario y la función de logout desde el contexto
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout(); // Cierra sesión
      navigate('/usuarios/login'); // Redirige al login
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // Definir los elementos del menú usando la propiedad `items`
  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: <Link to="/dashboard">Dashboard</Link>,
    },
    {
      key: 'colaborators',
      icon: <TeamOutlined />,
      label: <Link to="/dashboard/colaborators">Colaboradores</Link>,
    },
    {
      key: 'puestos',
      icon: <BankOutlined />,
      label: <Link to="/dashboard/puestos">Puestos</Link>,
    },
    {
      key: 'users',
      icon: <UserOutlined />,
      label: <Link to="/dashboard/users">Usuarios</Link>,
    },
    {
      key: 'csv',
      icon: <UploadOutlined />,
      label: 'Subir por CSV',
      children: [
        {
          key: 'csvColab',
          label: <Link to="/dashboard/csvColab">Colaboradores</Link>,
        },
        {
          key: 'csvPuestos',
          label: <Link to="/dashboard/csvPuestos">Puestos</Link>,
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col h-screen bg-[#00274d] border-r-2 border-[#004c99] shadow-lg">
      {/* Logo o avatar del usuario */}
      <div className="flex items-center justify-center p-4 border-b border-[#004c99]">
        <div className="flex items-center">
          <div className="w-16 h-16 bg-[#66b2ff] rounded-full flex items-center justify-center">
            <UserOutlined className="text-white text-2xl" />
          </div>
          <div className="text-white text-center ml-3">
            <strong>{user?.nombre || 'Usuario no identificado'}</strong>
            <br />
            <span>{user?.email || 'Correo no disponible'}</span>
          </div>
        </div>
      </div>

      {/* Menú */}
      <Menu
        theme="dark" // Fondo oscuro
        mode="inline" // Modo vertical
        className="bg-transparent flex-1"
        items={menuItems} // Usar la propiedad `items` en lugar de `children`
      />

      {/* Botón de cerrar sesión */}
      <div className="p-4 border-t border-[#004c99]">
        <button
          onClick={handleLogout}
          className="w-full bg-[#004c99] text-white font-bold py-2 px-4 rounded flex items-center justify-center hover:bg-[#003366] transition-colors"
        >
          <LogoutOutlined className="mr-2" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

export default AppSidebar;