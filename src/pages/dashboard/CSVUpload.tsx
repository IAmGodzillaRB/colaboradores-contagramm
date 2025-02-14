import React, { useState } from 'react';
import Papa from 'papaparse';
import { db } from '../../service/firebaseConfig';
import { collection, query, getDocs, where, setDoc, doc } from 'firebase/firestore';
import { FaSpinner } from 'react-icons/fa';
import Swal from 'sweetalert2';

interface CSVUploadProps {}

const CSVUpload: React.FC<CSVUploadProps> = () => {
    const [csvData, setCsvData] = useState<string[][]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const itemsPerPage = 10;

    // Limpiar y filtrar los datos del CSV
    const cleanData = (data: string[][]): string[][] => {
        const seenPuestos = new Set();
        return data
            .map(row => row.filter(cell => cell && cell.trim() !== '')) // Filtrar celdas vacías
            .filter(row => row.length > 0) // Eliminar filas vacías
            .filter(row => {
                const nombrePuesto = row[0]?.toLowerCase(); // Validar duplicados insensibles a mayúsculas
                if (seenPuestos.has(nombrePuesto)) {
                    return false;
                }
                seenPuestos.add(nombrePuesto);
                return true;
            });
    };

    // Manejar la carga de archivo CSV
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type === 'text/csv') {
            Papa.parse(file, {
                complete: (result) => {
                    const cleanedData = cleanData(result.data as string[][]);  // Aquí aseguramos que los datos sean del tipo string[][]
                    setCsvData(cleanedData);
                    setError(null);
                },
                error: () => {
                    setError('Error al procesar el archivo CSV');
                    setCsvData([]);
                },
                header: false,
                skipEmptyLines: true,
            });
        } else {
            setError('Por favor, sube un archivo CSV válido.');
        }
    };

    const csvHeaders = ['PUESTO', 'CANTIDAD DE COLABORADORES'];

    // Subir los datos a Firebase
    const uploadToFirebase = async () => {
        setLoading(true);
        const puestosRef = collection(db, 'puestos');
        let success = true;

        for (const row of csvData) {
            const nombrePuesto = row[0] || 'Sin puesto';
            const q = query(puestosRef, where('nombrePuesto', '==', nombrePuesto));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // Actualizar documento existente
                const docId = querySnapshot.docs[0].id;
                const docRef = doc(db, 'puestos', docId);
                try {
                    await setDoc(docRef, {
                        nombrePuesto,
                    }, { merge: true });
                } catch (error) {
                    console.error("Error al sobrescribir documento existente:", error);
                    success = false;
                }
            } else {
                // Crear nuevo documento
                try {
                    await setDoc(doc(puestosRef), { nombrePuesto });
                } catch (error) {
                    console.error("Error al crear nuevo documento:", error);
                    success = false;
                }
            }
        }

        setLoading(false);

        if (success) {
            Swal.fire({
                title: '¡CSV SUBIDO CORRECTAMENTE!',
                text: '¡Los datos se han cargado con éxito!',
                icon: 'success',
                confirmButtonText: 'Cerrar',
                confirmButtonColor: '#d33',
            });
        } else {
            Swal.fire({
                title: '¡Ups!',
                text: '¡Error al subir el archivo CSV!',
                icon: 'error',
                confirmButtonText: 'Cerrar',
                confirmButtonColor: '#d33',
            });
        }
    };

    // Paginación de datos
    const paginateData = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return csvData.slice(startIndex, endIndex);
    };

    const totalPages = Math.ceil(csvData.length / itemsPerPage);

    return (
        <div className="p-6 border border-gray-300 rounded-lg shadow-lg max-w-full mx-auto bg-gray-50">
            <h2 className="text-2xl font-semibold text-center mb-4 text-gray-800">Subir archivo CSV</h2>
            <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="mb-6 p-3 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300 ease-in-out"
            />

            {error && <p className="text-red-500 text-center mb-4">{error}</p>}

            {csvData.length > 0 && (
                <div className="overflow-x-auto mt-6 w-full">
                    <table className="table-auto border-collapse bg-white shadow-lg rounded-lg mx-auto w-full">
                        <thead className="bg-blue-600 text-white">
                            <tr>
                                {csvHeaders.map((header, index) => (
                                    <th
                                        key={index}
                                        className="px-6 py-3 text-left font-semibold text-sm uppercase tracking-wider"
                                    >
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {paginateData().map((row, index) => (
                                <tr key={index} className="border-t hover:bg-blue-50 transition-all duration-300">
                                    {row.map((value, idx) => (
                                        <td key={idx} className="px-6 py-4 text-gray-700 text-sm break-words max-w-xs">
                                            {value}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {csvData.length > 0 && (
                <div className="flex justify-center items-center mt-4 gap-4">
                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((prev) => prev - 1)}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50"
                    >
                        Anterior
                    </button>
                    <p className="text-gray-700 font-medium">
                        Página {currentPage} de {totalPages}
                    </p>
                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((prev) => prev + 1)}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50"
                    >
                        Siguiente
                    </button>
                </div>
            )}

            <div className="mt-6 text-center">
                <button
                    onClick={uploadToFirebase}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors duration-300"
                    disabled={loading}
                >
                    {loading ? <FaSpinner className="animate-spin" /> : 'Subir a Firebase'}
                </button>
            </div>
        </div>
    );
};

export default CSVUpload;
