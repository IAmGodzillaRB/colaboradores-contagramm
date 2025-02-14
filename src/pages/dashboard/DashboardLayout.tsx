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
  const { user } = useAuth(); // Obtener el usuario desde el contexto
  const sidebarRef = useRef<HTMLDivElement>(null); // Ref para la barra lateral

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

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
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
          marginLeft: isMobile && collapsed ? '0' : isMobile ? '80px' : collapsed ? '80px' : '256px', // Ajustar margen en móviles
          transition: 'margin-left 0.2s',
        }}
      >
        {/* Encabezado */}
        <div className="bg-[#00274d] shadow-sm p-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-4">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={toggleCollapse}
              style={{ color: 'white' }}
            />
            <h1 className="text-2xl font-bold">Bienvenido, {user?.nombre || 'Usuario'}</h1>
          </div>
          <div className="w-12 h-12 bg-[#66b2ff] rounded-full flex items-center justify-center">
            <img
              src={user?.avatar || '/default-avatar.png'} // Usar el avatar del usuario o uno por defecto
              alt="Avatar"
              className="w-full h-full rounded-full"
            />
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