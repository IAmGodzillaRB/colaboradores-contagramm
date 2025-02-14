import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route } from 'react-router-dom';
import SidebarComponent from '../../components/AppSidebar';
import Colaborators from './Colaborators';
import CSVColab from './CSVUpload';
import Puestos from './Puestos';
import CSVPuestos from '../dashboard/CSVUpload';
import Users from '../dashboard/UsersManagement';
import { Helmet } from 'react-helmet';
import { useAuth } from '../../context/AuthContext'; // Importar el contexto de autenticación
import { Button } from 'antd';
import { MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons';

const DashboardLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Estado para controlar el menú
  const { user, logout } = useAuth(); // Obtener el usuario y la función de logout desde el contexto
  const sidebarRef = useRef<HTMLDivElement>(null); // Ref para la barra lateral
  const menuRef = useRef<HTMLDivElement>(null); // Ref para el menú desplegable

  // Colapsar automáticamente en dispositivos móviles
  useEffect(() => {
    const handleResize = () => {
      const isMobileView = window.innerWidth <= 768;
      setIsMobile(isMobileView);

      if (isMobileView) {
        setCollapsed(true); // Colapsar en móviles
      } else {
        setCollapsed(false); // Expandir en escritorio
      }
    };

    handleResize(); // Ejecutar al montar
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Ocultar la barra lateral al hacer clic fuera de ella (solo en móviles)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMobile && // Solo en móviles
        sidebarRef.current && // Verificar que la barra lateral exista
        !sidebarRef.current.contains(event.target as Node) // Verificar si el clic fue fuera
      ) {
        setCollapsed(true); // Colapsar la barra lateral
      }
    };

    // Agregar el event listener al documento
    document.addEventListener('mousedown', handleClickOutside);

    // Limpiar el event listener al desmontar
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobile]);

  // Cerrar el menú al hacer clic fuera de él
  useEffect(() => {
    const handleClickOutsideMenu = (event: MouseEvent) => {
      if (
        menuRef.current && // Verificar que el menú exista
        !menuRef.current.contains(event.target as Node) // Verificar si el clic fue fuera
      ) {
        setIsMenuOpen(false); // Cerrar el menú
      }
    };

    // Agregar el event listener al documento
    document.addEventListener('mousedown', handleClickOutsideMenu);

    // Limpiar el event listener al desmontar
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideMenu);
    };
  }, []);

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const handleLogout = async () => {
    try {
      await logout(); // Cerrar sesión
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
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
        <SidebarComponent collapsed={collapsed} isMobile={isMobile} />
      </div>

      {/* Contenido principal */}
      <main
        className="flex-1 bg-gray-100 overflow-auto transition-all"
        style={{
          transition: 'margin-left 0.3s ease-in-out', // Animación suave
        }}
      >
        {/* Encabezado */}
        <div className="bg-[#00274d] shadow-sm p-4 lg:p-6 flex justify-between items-center text-white">
          {/* Botón a la izquierda */}
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
              onClick={() => setIsMenuOpen(!isMenuOpen)} // Abrir/cerrar el menú
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
                  transform: 'translateY(10px)', // Ajustar posición
                }}
              >
                {/* Viñeta */}
                <div
                  className="absolute -top-2 right-4 w-4 h-4 bg-white transform rotate-45"
                  style={{
                    boxShadow: '-2px -2px 2px rgba(0, 0, 0, 0.1)', // Sombra para la viñeta
                  }}
                ></div>

                {/* Opciones del menú */}
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