import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  BankOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const AppSidebar: React.FC<{ collapsed: boolean; isMobile: boolean }> = ({ collapsed, isMobile }) => {
  const { logout } = useAuth(); // Obtén la función de logout desde el contexto
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
  ];

  return (
    <div
      className={`flex flex-col h-screen bg-[#00274d] border-r-2 border-[#004c99] shadow-lg ${
        collapsed && !isMobile ? 'w-20' : 'w-64' // Ancho fijo en móviles, colapsado en escritorio
      }`}
      style={{
        position: isMobile ? 'fixed' : 'static', // Posición fija en móviles, estática en escritorio
        height: '100vh',
        zIndex: 1,
        transition: isMobile ? 'transform 0.3s ease-in-out' : 'width 0.3s ease-in-out', // Animación suave
        transform: isMobile && collapsed ? 'translateX(-100%)' : 'translateX(0)', // Deslizar el sidebar en móviles
      }}
    >
      {/* Logo */}
      <div className="flex items-center justify-center p-4 border-b border-[#004c99]">
        <img
          src={collapsed && !isMobile ? "/Isotipo-blanco.png" : "/logo-blanco.png"} // Cambiar logo en escritorio
          alt="Logo"
          className={collapsed && !isMobile ? "w-28" : "w-28"} // Cambiar tamaño en escritorio
        />
      </div>

      {/* Menú */}
      <Menu
        theme="dark" // Fondo oscuro
        mode="inline" // Modo vertical
        className="bg-transparent flex-1"
        inlineCollapsed={collapsed && !isMobile} // Colapsar el menú en escritorio
        items={menuItems} // Usar la propiedad `items`
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