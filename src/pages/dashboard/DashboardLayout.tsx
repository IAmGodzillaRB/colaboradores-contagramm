import React from 'react';
import { Routes, Route } from 'react-router-dom';
import SidebarComponent from '../../components/AppSidebar';
import Colaborators from './Colaborators';
import CSVColab from './CSVUpload';
import Puestos from './Puestos';
import CSVPuestos from '../dashboard/CSVUpload';
import Users from '../dashboard/UsersManagement';

const DashboardLayout: React.FC = () => {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <SidebarComponent />

      {/* Contenido principal */}
      <main className="flex-1 p-6 bg-gray-100 overflow-y-auto">
        <Routes>
          {/* Ruta principal del dashboard */}
          <Route index element={<div>Bienvenido al Dashboard</div>} />

          {/* Subrutas del dashboard */}
          <Route path="colaborators" element={<Colaborators />} />
          <Route path="puestos" element={<Puestos />} />
          <Route path="csvColab" element={<CSVColab />} />
          <Route path="csvPuestos" element={<CSVPuestos />} />
          <Route path="users" element={<Users />} />
        </Routes>
      </main>
    </div>
  );
};

export default DashboardLayout;