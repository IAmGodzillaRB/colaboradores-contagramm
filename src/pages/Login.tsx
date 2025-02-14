import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { Button, Form, Input, Spin, message } from 'antd';
import Swal from 'sweetalert2';
import 'antd/dist/reset.css';
import logo from '../../public/logo.svg';
import { useAuth } from '../context/AuthContext'; // Importa useAuth

const Login = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const auth = getAuth();
  const { user } = useAuth(); // Obtén el estado del usuario desde AuthContext

  useEffect(() => {
    // Si el usuario está autenticado, redirige al dashboard
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // No necesitas redirigir aquí, el useEffect se encargará de eso
    } catch (error: any) {
      setLoading(false);
      if (error.code === 'auth/user-not-found') {
        Swal.fire({
          icon: 'error',
          title: 'Usuario no encontrado',
          text: 'Por favor verifica el correo electrónico ingresado.',
        });
      } else if (error.code === 'auth/wrong-password') {
        setError('Contraseña incorrecta');
        message.error('Contraseña incorrecta');
      } else {
        setError('Error al iniciar sesión: ' + error.message);
        message.error('Error al iniciar sesión: ' + error.message);
      }
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-sm w-96 text-center border border-gray-100">
        {/* Logo */}
        <img
          src={logo}
          alt="Logo de la aplicación"
          className="w-24 h-24 mx-auto mb-6"
        />
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Iniciar sesión</h2>
        {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
        <Form onFinish={handleSubmit} layout="vertical">
          <Form.Item
            label="Correo electrónico"
            name="email"
            rules={[{ required: true, message: 'Por favor ingresa tu correo electrónico' }]}
          >
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
            />
          </Form.Item>
          <Form.Item
            label="Contraseña"
            name="password"
            rules={[{ required: true, message: 'Por favor ingresa tu contraseña' }]}
          >
            <Input.Password
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full"
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600"
            >
              {loading ? <Spin size="small" /> : 'Iniciar sesión'}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default Login;