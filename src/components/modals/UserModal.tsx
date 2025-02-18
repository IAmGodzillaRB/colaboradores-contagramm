import React from "react";
import { Modal, Form, Input, Select, Button } from "antd";

interface UserModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: any) => void;
  formData: {
    id?: string;
    nombre: string;
    email: string;
    password?: string;
    rol: string;
  };
  isEditMode: boolean;
  loading: boolean;
}

const UserModal: React.FC<UserModalProps> = ({
  open,
  onClose,
  onSubmit,
  formData,
  isEditMode,
  loading,
}) => {
  const [form] = Form.useForm();

  // Resetear el formulario cuando se abra el modal o cambien los datos
  React.useEffect(() => {
    form.setFieldsValue(formData);
  }, [formData, open]);

  return (
    <Modal
      title={isEditMode ? "Editar Usuario" : "Agregar Usuario"}
      open={open}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      footer={null}
      centered
      width={400}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item label="Nombre" name="nombre" rules={[{ required: true, message: "Ingrese el nombre" }]}>
          <Input placeholder="Nombre" />
        </Form.Item>

        <Form.Item label="Email" name="email" rules={[{ required: true, type: "email", message: "Ingrese un email válido" }]}>
          <Input placeholder="Correo electrónico" />
        </Form.Item>

        {!isEditMode && (
          <Form.Item
            label="Contraseña"
            name="password"
            rules={[
              { required: true, message: "Ingrese la contraseña" },
              { min: 6, message: "La contraseña debe tener al menos 6 caracteres" },
            ]}
          >
            <Input.Password placeholder="Contraseña" />
          </Form.Item>
        )}

        <Form.Item label="Rol" name="rol" rules={[{ required: true, message: "Seleccione un rol" }]}>
          <Select placeholder="Seleccione un rol">
            <Select.Option value="admin">Admin</Select.Option>
            <Select.Option value="editor">Editor</Select.Option>
            <Select.Option value="usuario">Usuario</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button type="default" danger onClick={onClose}>
              Cancelar
            </Button>
            <Button type="primary" htmlType="submit" loading={loading} disabled={loading}>
              {isEditMode ? "Actualizar" : "Guardar"}
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UserModal;