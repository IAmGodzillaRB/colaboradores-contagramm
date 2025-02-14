import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { db, query, getDocs, collection } from '../../service/firebaseConfig';
import Logo from '../../../public/vite.svg';

// Definir el tipo para los datos del colaborador
interface Colaborador {
  id: string;
  nombre: string;
  idColaborador: string;
  estatus: boolean;
}

const EmployeeVerifier: React.FC = () => {
  const [name, setName] = useState<string>('');
  const [suggestions, setSuggestions] = useState<Colaborador[]>([]);
  const [error, setError] = useState<string>('');
  const [modalData, setModalData] = useState<Colaborador | null>(null);

  // Función para buscar colaboradores en Firestore
  const searchColaboradores = async (input: string): Promise<Colaborador[]> => {
    try {
      const q = query(collection(db, 'colaboradores'));
      const querySnapshot = await getDocs(q);
      const colaboradores: Colaborador[] = [];

      querySnapshot.forEach((doc) => {
        const colaboradorData = doc.data();
        const colaboradorName = colaboradorData.nombre;
        const colaboradorId = colaboradorData.idColaborador.toString();

        if (
          colaboradorName.toLowerCase().includes(input.toLowerCase()) ||
          colaboradorId.includes(input)
        ) {
          colaboradores.push({ id: doc.id, ...colaboradorData } as Colaborador);
        }
      });

      return colaboradores;
    } catch (error) {
      console.error('Error buscando colaboradores:', error);
      return [];
    }
  };

  // Manejar la tecla "Enter" en el input
  const handleEnterKey = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const colaboradores = await searchColaboradores(name);
      handleColaboradorSearchResult(colaboradores);
    }
  };

  // Manejar el clic en el botón "Verificar"
  const handleVerifyButtonClick = async () => {
    if (name) {
      const colaboradores = await searchColaboradores(name);
      handleColaboradorSearchResult(colaboradores);
    } else {
      setError('Por favor, ingrese un nombre o número de colaborador');
    }
  };

  // Manejar el resultado de la búsqueda de colaboradores
  const handleColaboradorSearchResult = (colaboradores: Colaborador[]) => {
    if (colaboradores && colaboradores.length > 0) {
      setModalData(colaboradores[0]);
      console.log('Estado del colaborador:', colaboradores[0].estatus ? 'Activo' : 'Inactivo');
    } else {
      Swal.fire({
        title: '¡Error!',
        text: '¡Colaborador no encontrado!',
        icon: 'error',
        confirmButtonText: 'Cerrar',
        confirmButtonColor: '#d33',
      });
    }
  };

  // Manejar cambios en el input de nombre
  const handleNameInput = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value.trim();
    setName(input);
    if (!input) {
      setSuggestions([]);
      return;
    }

    const colaboradores = await searchColaboradores(input);
    setSuggestions(colaboradores);
  };

  // Manejar clic en una sugerencia de la lista
  const handleSuggestionClick = (selectedColaborador: Colaborador) => {
    setName(selectedColaborador.nombre);
    setSuggestions([]);
    setModalData(selectedColaborador);
    console.log('Estado del colaborador seleccionado:', selectedColaborador.estatus ? 'Activo' : 'Inactivo');
  };

  // Cerrar el modal
  const closeModal = () => {
    setModalData(null);
    setName('');
  };

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <img className="mx-auto h-32 w-auto lg:h-40" src={Logo} alt="Logo Contagramm" />
        <h2 className="mt-6 text-2xl font-bold tracking-tight text-blue-900 sm:text-3xl lg:text-2xl">
          VERIFICADOR DE EMPLEADO
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl lg:max-w-2xl">
        <form className="space-y-6 px-4 sm:px-6 lg:px-12">
          <div className="flex flex-col items-center">
            <label htmlFor="name" className="block text-sm font-bold text-black text-center sm:text-base lg:text-lg">
              Nombre o N° Colaborador
            </label>
            <div className="mt-2 w-full flex flex-col items-center relative">
              <input
                id="name"
                name="nameEmp"
                type="text"
                value={name}
                onChange={handleNameInput}
                onKeyDown={handleEnterKey}
                className="block w-full sm:w-3/4 md:w-2/3 lg:w-3/5 xl:w-1/2 rounded-md border-0 py-3 text-gray-900 text-center shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm lg:text-base"
              />
              {error && <span className="text-red-500 text-xs sm:text-sm mt-1">{error}</span>}
              <ul
                id="suggestions-list"
                className={`z-10 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto mt-1 ${
                  suggestions.length === 0 ? 'hidden' : ''
                }`}
              >
                {suggestions.length > 0
                  ? suggestions.map((colaborador) => (
                      <li
                        key={colaborador.id}
                        className="px-4 py-2 hover:bg-gray-200 cursor-pointer"
                        onClick={() => handleSuggestionClick(colaborador)}
                      >
                        {colaborador.nombre}
                      </li>
                    ))
                  : null}
              </ul>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              className="w-full sm:w-1/3 md:w-1/4 lg:w-1/5 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              onClick={handleVerifyButtonClick}
            >
              Verificar
            </button>
          </div>
        </form>
      </div>

      {/* Modal */}
      {modalData && (
        <div id="modal" className="relative z-10" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          {/* Fondo del modal */}
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>

          {/* Modal */}
          <div className="fixed inset-0 z-10 flex items-center justify-center p-4 text-center sm:p-0">
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg lg:max-w-3xl">
              {/* Encabezado del modal */}
              <div
                id="modal-header"
                className={`px-4 pb-4 pt-5 sm:p-6 sm:pb-4 rounded-t-lg ${
                  modalData.estatus ? 'bg-green-200' : 'bg-red-200'
                }`}
              >
                <div className="sm:flex sm:items-center sm:justify-start">
                  {/* Círculo con el icono */}
                  <div
                    className={`mx-auto sm:mx-0 flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${
                      modalData.estatus ? 'bg-green-600' : 'bg-red-600'
                    }`}
                    id="modal-icon-container"
                  >
                    {modalData.estatus ? (
                      <svg
                        id="modal-icon-check"
                        className="h-8 w-8 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg
                        id="modal-icon-x"
                        className="h-8 w-8 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>

                  <div className="mt-3 text-left sm:ml-4 sm:mt-0">
                    {/* Título del modal */}
                    <h3 id="modal-title" className="text-xl font-semibold text-gray-900">
                      Colaborador {modalData.estatus ? 'Activo' : 'Inactivo'}
                    </h3>
                    <p className="mt-1 text-base text-gray-600">Información del colaborador:</p>
                  </div>
                </div>
              </div>

              {/* Cuerpo del modal */}
              <div className="px-4 py-5 sm:p-6 bg-gray-50">
                <dl className="space-y-4 text-sm">
                  <div className="flex items-center justify-start space-x-1">
                    <dt className="text-gray-500">Nombre: </dt>
                    <dd className="text-gray-900">{modalData.nombre}</dd>
                  </div>
                  <div className="flex items-center justify-start space-x-1">
                    <dt className="text-gray-500">ID de colaborador: </dt>
                    <dd className="text-gray-900">{modalData.idColaborador}</dd>
                  </div>
                </dl>
              </div>

              {/* Pie del modal */}
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 bg-blue-600 px-4 py-2 text-base font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:w-auto"
                  onClick={closeModal}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeVerifier;