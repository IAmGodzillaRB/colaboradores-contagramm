import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, Select, Form, message } from 'antd';
import { db, collection, getDocs, addDoc, doc, updateDoc, getDoc } from '../../service/firebaseConfig';
import { UserOutlined, IdcardOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

// Definir los tipos de los datos
interface Puesto {
  id: string;
  nombrePuesto: string;
}

interface Colaborador {
  id?: string; // ID opcional (generado por Firestore)
  idColaborador: string;
  nombre: string;
  idPuesto: string;
  estatus: boolean;
}

interface ColaboradorModalProps {
  open: boolean;
  isEditMode: boolean;
  collaboratorData?: Colaborador;  // Colaborador opcional para cuando se edita
  onClose: () => void;
  onUpdate: () => void;
}

const ColaboradorModal: React.FC<ColaboradorModalProps> = ({ open, isEditMode, collaboratorData, onClose, onUpdate }) => {
  const [formData, setFormData] = useState<Colaborador>({
    idColaborador: '',
    nombre: '',
    idPuesto: '',
    estatus: true,  // Estatus como booleano (true = activo, false = inactivo)
  });

  const [puestos, setPuestos] = useState<Puesto[]>([]); // Opciones de la colección de puestos
  const [form] = Form.useForm(); // Obtener la instancia del formulario

  // Obtener datos de la colección 'puestos' al cargar el componente
  useEffect(() => {
    const fetchPuestos = async () => {
      try {
        const puestosCollection = collection(db, 'puestos');
        const puestosSnapshot = await getDocs(puestosCollection);
        const puestosData = puestosSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Puesto[];

        const sortedPuestos = puestosData.sort((a, b) =>
          a.nombrePuesto.localeCompare(b.nombrePuesto)
        );

        setPuestos(sortedPuestos);

      } catch (error) {
        console.error('Error al obtener los puestos:', error);
      }
    };
    fetchPuestos();
  }, []);

  // Inicializar datos del formulario cuando se abra el modal
  useEffect(() => {
    if (isEditMode && collaboratorData) {
      console.log('Datos de colaborador para editar:', collaboratorData);  // Agrega un log para ver los datos
      setFormData({
        idColaborador: collaboratorData.idColaborador || '',
        nombre: collaboratorData.nombre || '',
        idPuesto: collaboratorData.idPuesto || '',
        estatus: collaboratorData.estatus,  // Estatus ya es un booleano
      });
      // Actualiza los valores del formulario
      form.setFieldsValue({
        idColaborador: collaboratorData.idColaborador || '',
        nombre: collaboratorData.nombre || '',
        idPuesto: collaboratorData.idPuesto || '',
        estatus: collaboratorData.estatus ? 'true' : 'false', // Convertir booleano a cadena para el Select
      });
    } else {
      setFormData({
        idColaborador: '',
        nombre: '',
        idPuesto: '',
        estatus: true,  // Por defecto, 'Activo' (true)
      });
      form.resetFields(); // Reiniciar campos en caso de no estar en modo de edición
    }
  }, [isEditMode, collaboratorData, form]);

  // Guardar cambios
  const handleSave = async () => {
    try {
      const puestoRef = doc(db, 'puestos', formData.idPuesto);

      // Crear los datos del colaborador, manteniendo 'estatus' como un booleano
      const colaboradorData = {
        idColaborador: formData.idColaborador,
        nombre: formData.nombre,
        idPuesto: puestoRef,
        estatus: formData.estatus,  // 'estatus' sigue siendo un booleano
      };

      console.log('Datos a guardar:', colaboradorData); // Ver los datos antes de guardar

      if (isEditMode) {
        // Verificar si collaboratorData está definido y tiene un ID
        if (!collaboratorData || !collaboratorData.id) {
          console.error('No se encontró el colaborador para actualizar o falta el ID.');
          message.error('No se encontró el colaborador para actualizar o falta el ID.');
          return;
        }

        // Aquí usamos el ID del documento de Firestore para actualizar
        const docRef = doc(db, 'colaboradores', collaboratorData.id);  // Usamos `id` de Firestore
        const docSnapshot = await getDoc(docRef);

        if (!docSnapshot.exists()) {
          console.error('No se encontró el colaborador con el ID:', collaboratorData.id);
          message.error('No se encontró el colaborador para actualizar.');
          return;
        }

        await updateDoc(docRef, colaboradorData);
        message.success('¡Éxito! Colaborador actualizado correctamente.');
      } else {
        const collectionRef = collection(db, 'colaboradores');
        const docRef = await addDoc(collectionRef, colaboradorData);
        message.success('¡Éxito! Nuevo colaborador agregado correctamente.');
        console.log("Nuevo colaborador ID:", docRef.id); // Obtener el ID generado por Firestore
      }

      onUpdate();  // Actualiza la lista de colaboradores
      onClose();   // Cierra el modal
    } catch (error) {
      console.error('Error al guardar el colaborador:', error);
      message.error('Hubo un problema al guardar los datos.');
    }
  };

  return (
    <Modal
      title={isEditMode ? 'Editar Colaborador' : 'Agregar Colaborador'}
      visible={open}
      onCancel={onClose}
      footer={null}
      width={600} // Ajustar el ancho del modal
      bodyStyle={{ padding: '24px' }} // Ajustar el padding interno
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
      >
        {/* Campo ID Colaborador */}
        <Form.Item
          label="ID Colaborador"
          name="idColaborador"
          rules={[{ required: true, message: 'El ID del colaborador es obligatorio' }]}
        >
          <Input
            prefix={<IdcardOutlined />} // Ícono para el campo
            placeholder="Ingrese el ID del colaborador"
            value={formData.idColaborador}
            onChange={(e) => setFormData({ ...formData, idColaborador: e.target.value })}
          />
        </Form.Item>

        {/* Campo Nombre */}
        <Form.Item
          label="Nombre"
          name="nombre"
          rules={[{ required: true, message: 'El nombre es obligatorio' }]}
        >
          <Input
            prefix={<UserOutlined />} // Ícono para el campo
            placeholder="Ingrese el nombre del colaborador"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          />
        </Form.Item>

        {/* Campo Puesto */}
        <Form.Item
          label="Puesto"
          name="idPuesto"
          rules={[{ required: true, message: 'El puesto es obligatorio' }]}
        >
          <Select
            placeholder="Seleccione un puesto"
            value={formData.idPuesto}
            onChange={(value) => setFormData({ ...formData, idPuesto: value })}
          >
            {puestos.map((puesto) => (
              <Select.Option key={puesto.id} value={puesto.id}>
                {puesto.nombrePuesto}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {/* Campo Estatus */}
        <Form.Item
          label="Estatus"
          name="estatus"
          rules={[{ required: true, message: 'El estatus es obligatorio' }]}
        >
          <Select
            placeholder="Seleccione el estatus"
            value={formData.estatus ? 'true' : 'false'}  // Convertir booleano a cadena
            onChange={(value) => setFormData({ ...formData, estatus: value === 'true' })}  // Convertir cadena a booleano
          >
            <Select.Option value="true">
              <CheckCircleOutlined style={{ color: '#52c41a' }} /> Activo
            </Select.Option>
            <Select.Option value="false">
              <CloseCircleOutlined style={{ color: '#ff4d4f' }} /> Inactivo
            </Select.Option>
          </Select>
        </Form.Item>

        {/* Botones de acción */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button type="default" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="primary" htmlType="submit">
            Guardar
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default ColaboradorModal;