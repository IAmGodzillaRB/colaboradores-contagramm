import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route } from 'react-router-dom';
import SidebarComponent from '../../components/AppSidebar';
import Colaborators from './Colaborators';
import CSVColab from './CSVUpload';
import Puestos from './Puestos';
import CSVPuestos from '../dashboard/CSVUpload';
import Users from '../dashboard/UsersManagement';
import { Helmet } from 'react-helmet';
import { useAuth } from '../../context/AuthContext';
import { Button } from 'antd';
import { MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons';

const DashboardLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Colapsar automáticamente en dispositivos móviles
  useEffect(() => {
    const handleResize = () => {
      const isMobileView = window.innerWidth <= 768;
      setIsMobile(isMobileView);

      if (isMobileView) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Ocultar la barra lateral al hacer clic fuera de ella (solo en móviles)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMobile &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setCollapsed(true);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobile]);

  // Cerrar el menú al hacer clic fuera de él
  useEffect(() => {
    const handleClickOutsideMenu = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutsideMenu);

    return () => {
      document.removeEventListener('mousedown', handleClickOutsideMenu);
    };
  }, []);

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // Función para colapsar el sidebar
  const handleItemClick = () => {
    if (isMobile) {
      setCollapsed(true);
    }
  };

  return (
    <div className="flex h-screen">
      <Helmet>
        <title>Dashboard - Administración</title>
        <meta name="description" content="Panel de administración para gestionar colaboradores, puestos y usuarios." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Sidebar */}
      <div ref={sidebarRef}>
        <SidebarComponent
          collapsed={collapsed}
          isMobile={isMobile}
          onItemClick={handleItemClick} // Pasa la función como prop
        />
      </div>

      {/* Contenido principal */}
      <main
        className="flex-1 bg-gray-100 overflow-auto transition-all"
        style={{
          transition: 'margin-left 0.3s ease-in-out',
        }}
      >
        {/* Encabezado */}
        <div className="bg-[#00274d] shadow-sm p-4 lg:p-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-2 lg:gap-4">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={toggleCollapse}
              className="flex justify-center text-white p-2 text-xl hover:bg-transparent hover:text-white"
            />
            <h1 className="text-lg lg:text-2xl font-bold m-0">Bienvenido, {user?.nombre || 'Usuario'}</h1>
          </div>

          {/* Avatar a la derecha */}
          <div className="relative">
            <div
              className="w-10 h-10 lg:w-12 lg:h-12 bg-[#66b2ff] rounded-full flex items-center justify-center cursor-pointer"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <img
                src={user?.avatar || '/avatar.svg'}
                alt="Avatar"
                className="w-full h-full rounded-full"
              />
            </div>

            {/* Menú desplegable con viñeta */}
            {isMenuOpen && (
              <div
                ref={menuRef}
                className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-50"
                style={{
                  transform: 'translateY(10px)',
                }}
              >
                <div
                  className="absolute -top-2 right-4 w-4 h-4 bg-white transform rotate-45"
                  style={{
                    boxShadow: '-2px -2px 2px rgba(0, 0, 0, 0.1)',
                  }}
                ></div>

                <div className="py-1">
                  <button
                    onClick={handleLogout}
                    className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contenido dinámico */}
        <div className="p-2">
          <Routes>
            <Route index element={<h1 className="text-2xl font-bold">Bienvenido al Dashboard</h1>} />
            <Route path="colaborators" element={<Colaborators />} />
            <Route path="puestos" element={<Puestos />} />
            <Route path="csvColab" element={<CSVColab />} />
            <Route path="csvPuestos" element={<CSVPuestos />} />
            <Route path="users" element={<Users />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;