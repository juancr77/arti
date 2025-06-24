import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../../services/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import './Dashboard.css';

// --- Componentes de Iconos ---
const ExcelIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M21.17 3.25Q21.5 3.25 21.76 3.5 22 3.75 22 4.08V19.92Q22 20.25 21.76 20.5 21.5 20.75 21.17 20.75H2.83Q2.5 20.75 2.24 20.5 2 20.25 2 19.92V4.08Q2 3.75 2.24 3.5 2.5 3.25 2.83 3.25H21.17M12.25 6.13H15.16L12.91 10.1L15.18 14.13H12.2L10.71 11.39L9.22 14.13H6.31L8.59 10.1L6.39 6.13H9.3L10.75 8.79Z" />
  </svg>
);

const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M20 11V13H8L13.5 18.5L12.08 19.92L4.16 12L12.08 4.08L13.5 5.5L8 11H20Z" />
  </svg>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const [allPeticiones, setAllPeticiones] = useState([]);
  const [pendientes, setPendientes] = useState([]);
  const [enProceso, setEnProceso] = useState([]);
  const [resueltas, setResueltas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtroDireccion, setFiltroDireccion] = useState('todas');
  const [direccionesOptions, setDireccionesOptions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const peticionesQuery = query(collection(db, "peticiones"), orderBy("fecha", "desc"));
        const peticionesSnapshot = await getDocs(peticionesQuery);
        const listaPeticiones = peticionesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllPeticiones(listaPeticiones);

        const direccionesSnapshot = await getDocs(collection(db, "direcciones"));
        const listaDirecciones = direccionesSnapshot.docs.map(doc => doc.data().nombre).sort();
        setDireccionesOptions(listaDirecciones);

      } catch (error) {
        console.error("Error al obtener los datos: ", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const peticionesFiltradas = filtroDireccion === 'todas'
      ? allPeticiones
      : allPeticiones.filter(p => p.direccion === filtroDireccion);
    
    const pendientesArr = [], enProcesoArr = [], resueltasArr = [];
    peticionesFiltradas.forEach((reporte) => {
      switch (reporte.estatus) {
        case 'pendiente': pendientesArr.push(reporte); break;
        case 'en proceso': enProcesoArr.push(reporte); break;
        case 'resuelta': resueltasArr.push(reporte); break;
        default: break;
      }
    });
    setPendientes(pendientesArr);
    setEnProceso(enProcesoArr);
    setResueltas(resueltasArr);
  }, [allPeticiones, filtroDireccion]);

  const handleExportToExcel = async () => {
    const dataToExport = [...pendientes, ...enProceso, ...resueltas];
    if (dataToExport.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Reportes");

    worksheet.pageSetup = {
      paperSize: 9,
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0
    };

    try {
      const response = await fetch('https://i.imgur.com/5mavo8r.png');
      const imageBuffer = await response.arrayBuffer();
      const imageId = workbook.addImage({ buffer: imageBuffer, extension: 'png' });
      worksheet.addImage(imageId, 'A1:B4');
    } catch (error) {
      console.error("No se pudo cargar la imagen del logo para el Excel:", error);
    }
    
    // El título ahora abarca hasta la columna K
    worksheet.mergeCells('C1:K4');
    const titleCell = worksheet.getCell('C1');
    titleCell.value = 'Bienvenido(a) al sistema de reportes Arti';
    titleCell.font = { name: 'Arial Black', size: 18, bold: true, color: { argb: 'FF333333' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    
    worksheet.addRow([]);
    
    // --- ENCABEZADOS DE LA TABLA ACTUALIZADOS ---
    const headers = [
      'Nombre Completo', 'Teléfono', 'Fecha', 'Hora', 'Estatus', 
      'Dirección Asignada', 'Localidad', 'Ubicación', 'Origen', 'Petición Completa', 'Enlace a Imagen'
    ];
    const headerRow = worksheet.getRow(6);
    headerRow.values = headers;
    
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E7D32' } };
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });
    
    // Anchos de columna ajustados
    worksheet.getColumn('A').width = 25;
    worksheet.getColumn('B').width = 14;
    worksheet.getColumn('C').width = 11;
    worksheet.getColumn('D').width = 10;
    worksheet.getColumn('E').width = 14;
    worksheet.getColumn('F').width = 22;
    worksheet.getColumn('G').width = 22;
    worksheet.getColumn('H').width = 45; // Nueva columna Ubicación
    worksheet.getColumn('I').width = 15;
    worksheet.getColumn('J').width = 50;
    worksheet.getColumn('K').width = 20;
    
    // --- DATOS FORMATEADOS CON LA NUEVA COLUMNA ---
    const formattedData = dataToExport.map(reporte => {
        const calleYNumero = [reporte.calle, reporte.numeroExterior].filter(Boolean).join(' ');
        const colonia = reporte.colonia ? `Col. ${reporte.colonia}` : '';
        const entreCalles = (reporte.entreCalle1 && reporte.entreCalle2) 
          ? `entre calles: "${reporte.entreCalle1}" y "${reporte.entreCalle2}"` 
          : (reporte.entreCalle1 ? `cerca de ${reporte.entreCalle1}` : ''); // Maneja el caso de una sola calle de referencia
        
        const ubicacionCompleta = [calleYNumero, colonia, entreCalles].filter(Boolean).join(', ');

        return [
          `${reporte.nombres || ''} ${reporte.apellidoPaterno || ''} ${reporte.apellidoMaterno || ''}`,
          reporte.telefono,
          reporte.fecha ? new Date(reporte.fecha.seconds * 1000).toLocaleDateString() : 'N/A',
          reporte.hora || 'N/A',
          reporte.estatus,
          reporte.direccion,
          reporte.localidad,
          ubicacionCompleta, // Añadimos la nueva celda con la dirección completa
          reporte.origenReporte,
          reporte.peticion,
          reporte.ineURL ? { text: 'Ver Imagen', hyperlink: reporte.ineURL } : 'No adjunta'
        ]
    });
    worksheet.addRows(formattedData);

    // Aplicar estilos a las celdas de datos
    worksheet.eachRow({ includeEmpty: false }, function (row, rowNumber) {
      if (rowNumber > 6) {
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            cell.alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            // Centramos las columnas cortas
            if(['B','C','D','E'].includes(worksheet.getColumn(colNumber).letter)) {
              cell.alignment.horizontal = 'center';
            }
        });
        const statusCell = row.getCell('E');
        if (statusCell.value) {
            let fillColor = 'FFFFFFFF';
            if (statusCell.value === 'pendiente') fillColor = 'FFFFCDD2';
            if (statusCell.value === 'en proceso') fillColor = 'FFFFECB3';
            if (statusCell.value === 'resuelta') fillColor = 'FFC8E6C9';
            statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
        }
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, 'Reportes_Arti.xlsx');
  };

  const ReporteCard = ({ reporte }) => {
    const calleYNumero = [reporte.calle, reporte.numeroExterior].filter(Boolean).join(' ');
    const colonia = reporte.colonia ? `Col. ${reporte.colonia}` : '';
    const direccionCompleta = [calleYNumero, colonia].filter(Boolean).join(', ');

    return (
      <Link to={`/reporte/${reporte.id}`} className="dashboard-card">
        <h4>{reporte.nombres} {reporte.apellidoPaterno}</h4>
        
        {reporte.direccion && <div className="card-department">{reporte.direccion}</div>}
        
        {direccionCompleta && (
          <div className="card-address-block">
              <p className="card-address-title">Dirección Física:</p>
              <p className="card-address-content">{direccionCompleta}</p>
          </div>
        )}

        <p className="card-petition-title">Petición:</p>
        <p>{reporte.peticion.substring(0, 80)}{reporte.peticion.length > 80 ? '...' : ''}</p>
        
        <div className="card-footer">
          <span>{reporte.fecha ? new Date(reporte.fecha.seconds * 1000).toLocaleString() : 'Sin fecha'}</span>
        </div>
      </Link>
    );
  };

  if (isLoading) {
    return <div className="loading-container">Cargando Dashboard...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-top">
          <h1>Dashboard de Seguimiento</h1>
          <div className="header-actions">
            <button onClick={handleExportToExcel} className="action-button export-button">
              <ExcelIcon />
              Bajar Excel
            </button>
            <button onClick={() => navigate(-1)} className="action-button back-button">
              <BackIcon />
              Volver
            </button>
          </div>
        </div>
        <div className="filter-controls">
            <label htmlFor="filtroDireccion" style={{alignSelf: 'center'}}>Filtrar por Dirección:</label>
            <select id="filtroDireccion" value={filtroDireccion} onChange={e => setFiltroDireccion(e.target.value)}>
              <option value="todas">Todas las Direcciones</option>
              {direccionesOptions.map(dir => (
                <option key={dir} value={dir}>{dir}</option>
              ))}
            </select>
        </div>
      </div>
      
      <div className="dashboard-board">
        <div className="dashboard-column red">
          <h2>En Dirección a la que pertenece</h2>
          <div className="card-list">
            {pendientes.map(reporte => <ReporteCard key={reporte.id} reporte={reporte} />)}
          </div>
        </div>
        <div className="dashboard-column amber">
          <h2>Con Notas de seguimiento</h2>
          <div className="card-list">
            {enProceso.map(reporte => <ReporteCard key={reporte.id} reporte={reporte} />)}
          </div>
        </div>
        <div className="dashboard-column green">
          <h2>Acciones correctivas finales</h2>
          <div className="card-list">
            {resueltas.map(reporte => <ReporteCard key={reporte.id} reporte={reporte} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
