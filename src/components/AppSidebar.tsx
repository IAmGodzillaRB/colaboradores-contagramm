import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  BankOutlined,
  UserOutlined,
  LogoutOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const AppSidebar: React.FC<{
  collapsed: boolean;
  isMobile: boolean;
  onItemClick: () => void; 
}> = ({ collapsed, isMobile, onItemClick }) => {
  const { logout, user } = useAuth(); // Obtener el usuario del contexto
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/usuarios/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // Definir los elementos del menú
  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: <Link to="/dashboard" onClick={onItemClick}>Dashboard</Link>,
    },
    {
      key: 'colaborators',
      icon: <TeamOutlined />,
      label: <Link to="/dashboard/colaborators" onClick={onItemClick}>Colaboradores</Link>,
    },
    {
      key: 'puestos',
      icon: <BankOutlined />,
      label: <Link to="/dashboard/puestos" onClick={onItemClick}>Puestos</Link>,
    },
    {
      key: 'users',
      icon: <UserOutlined />,
      label: <Link to="/dashboard/users" onClick={onItemClick}>Usuarios</Link>,
    },
    {
      key: 'attendance',
      icon: <CheckCircleOutlined />,
      label: <Link to="/dashboard/attendance" onClick={onItemClick}>Verificar Asistencia</Link>,
    },
    {
      key: 'locations',
      icon: <CheckCircleOutlined />,
      label: <Link to="/dashboard/locations" onClick={onItemClick}>Ubicaciones</Link>,
    },
    {
      key: 'asistencias',
      icon: <CheckCircleOutlined />,
      label: <Link to="/dashboard/asistencias" onClick={onItemClick}>Asistencias</Link>,
    }
  ];

  // Filtrar los elementos del menú basados en el rol del usuario
  const filteredMenuItems = menuItems.filter((item) => {
    switch (user?.rol) {
      case 'admin':
        // El administrador ve todo
        return true;
      case 'editor':
        // El editor ve todo excepto "Usuarios" y "Verificar Asistencia"
        return item.key !== 'users' && item.key !== 'attendance';
      case 'usuario':
        // El usuario solo ve "Verificar Asistencia"
        return item.key === 'attendance';
      default:

        return false;
    }
  });

  return (
    <div
      className={`flex flex-col h-screen bg-[#00274d] border-r-2 border-[#004c99] shadow-lg ${collapsed && !isMobile ? 'w-20' : 'w-64'
        }`}
      style={{
        position: isMobile ? 'fixed' : 'static',
        height: '100vh',
        zIndex: 1,
        transition: isMobile ? 'transform 0.3s ease-in-out' : 'width 0.3s ease-in-out',
        transform: isMobile && collapsed ? 'translateX(-100%)' : 'translateX(0)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center justify-center p-4 border-b border-[#004c99]">
        <img
          src={collapsed && !isMobile ? "/Isotipo-blanco.png" : "/logo-blanco.png"}
          alt="Logo"
          className={collapsed && !isMobile ? "w-28" : "w-28"}
        />
      </div>

      {/* Menú */}
      <Menu
        theme="dark"
        mode="inline"
        className="bg-transparent flex-1"
        inlineCollapsed={collapsed && !isMobile}
        items={filteredMenuItems} // Usar los elementos filtrados
      />

      {/* Botón de cerrar sesión */}
      <div className="p-4 border-t border-[#004c99]">
        <button
          onClick={handleLogout}
          className="w-full bg-[#004c99] text-white font-bold py-2 px-4 rounded flex items-center justify-center hover:bg-[#003366] transition-colors"
        >
          <LogoutOutlined className="text-xl" />
          {!collapsed && <span className="ml-2">Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  );
};

export default AppSidebar;