import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/dashboard/DashboardLayout';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './service/ProtectedRoute';
import EmployeeVerifier from './pages/dashboard/EmployeeVerifier';

const App = () => {
  return (
    
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<EmployeeVerifier />} />
          <Route path="/usuarios/login" element={<Login />} />
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;