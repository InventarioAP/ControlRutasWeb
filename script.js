document.addEventListener('DOMContentLoaded', async () => {
    // --- SUBIR IMAGEN CON MODAL ---
    const abrirModalImagenBtn = document.getElementById('abrirModalImagen');
    const noValeCombustibleInput = document.getElementById('noValeCombustible');
    const galonesInput = document.getElementById('galones');
    const valorQuetzalInput = document.getElementById('valorQuetzal');

    // Function to check input fields and enable/disable the "Subir imagen" button
    const toggleSubirImagenButton = () => {
        if (noValeCombustibleInput.value || (parseFloat(galonesInput.value) > 0) || (parseFloat(valorQuetzalInput.value) > 0)) {
            abrirModalImagenBtn.disabled = false;
            abrirModalImagenBtn.style.backgroundColor = '#007bff'; // Revert to original blue
            abrirModalImagenBtn.style.cursor = 'pointer';
        } else {
            abrirModalImagenBtn.disabled = true;
            abrirModalImagenBtn.style.backgroundColor = '#cccccc'; // Grey out when disabled
            abrirModalImagenBtn.style.cursor = 'not-allowed';
        }
    };

    // Add event listeners to the relevant input fields
    noValeCombustibleInput.addEventListener('input', toggleSubirImagenButton);
    galonesInput.addEventListener('input', toggleSubirImagenButton);
    valorQuetzalInput.addEventListener('input', toggleSubirImagenButton);

    // Initial check when the page loads
    toggleSubirImagenButton();

    abrirModalImagenBtn.addEventListener('click', function() {
        document.getElementById('modalOpcionesImagen').style.display = 'flex';
    });

    document.getElementById('cerrarModalImagen').addEventListener('click', function() {
        document.getElementById('modalOpcionesImagen').style.display = 'none';
    });

    document.getElementById('btnSeleccionarImagen').addEventListener('click', function() {
        document.getElementById('inputSeleccionarImagen').click();
    });

    document.getElementById('btnTomarFoto').addEventListener('click', function() {
        document.getElementById('inputTomarFoto').click();
    });

    document.getElementById('inputSeleccionarImagen').addEventListener('change', function(e) {
        manejarImagenSeleccionada(e.target.files[0]);
    });

    document.getElementById('inputTomarFoto').addEventListener('change', function(e) {
        manejarImagenSeleccionada(e.target.files[0]);
    });

    // Función para mostrar la imagen seleccionada
    function manejarImagenSeleccionada(file) {
        const previewDiv = document.getElementById('foto-recibo-preview');
        previewDiv.innerHTML = '';
        if (file) {
            const img = document.createElement('img');
            img.style.maxWidth = '200px';
            img.style.maxHeight = '200px';
            img.src = URL.createObjectURL(file);
            previewDiv.appendChild(img);
            document.getElementById('foto-recibo').archivoSeleccionado = file;
        }
        document.getElementById('modalOpcionesImagen').style.display = 'none';
        // Scroll al botón de enviar
        const enviarBtn = document.querySelector('button[type="submit"]');
        if (enviarBtn) {
            enviarBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }


    // --- NUEVO: Establecer el año actual en el campo de año ---
    const anioInput = document.getElementById('anio');
    if (anioInput) {
        const currentYear = new Date().getFullYear();
        anioInput.value = currentYear;
    }
    // Populate Number of Day dropdown (1-31)
    const numeroDiaSelect = document.getElementById('numeroDia');
    for (let i = 1; i <= 31; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        numeroDiaSelect.appendChild(option);
    }

    // Referencias a los campos y botón de envío
    const kmInicialInput = document.getElementById('kmInicial');
    const kmFinalInput = document.getElementById('kmFinal');
    const kmDiaInput = document.getElementById('kmDia');
    const enviarBtn = document.querySelector('button[type="submit"]');

    // Función para calcular y validar KmDia
    const calculateKmDia = () => {
        const kmInicial = parseFloat(kmInicialInput.value) || 0;
        const kmFinal = parseFloat(kmFinalInput.value) || 0;
        const kmDia = kmFinal - kmInicial;
        if (kmDia >= 0) {
            kmDiaInput.value = kmDia.toFixed(2);
            kmDiaInput.style.backgroundColor = '';
            kmDiaInput.style.color = '';
            enviarBtn.disabled = false;
        } else {
            kmDiaInput.value = 'Error';
            kmDiaInput.style.backgroundColor = '#ffcccc';
            kmDiaInput.style.color = '#b30000';
            enviarBtn.disabled = true;
        }
    };

    kmInicialInput.addEventListener('input', calculateKmDia);
    kmFinalInput.addEventListener('input', calculateKmDia);

    // --- FUNCIONALIDAD: Llenar selects desde Google Sheets ---
    await llenarSelectsIngresoDatos();
    await llenarSelectsVerDatos();

    // Event listener para actualizar placa y piloto responsable al cambiar unidad
    document.getElementById('filterNumeroUnidad').addEventListener('change', async function () {
        await actualizarPlacaYPiloto();
    });

    // Event listener para form submit
    document.getElementById('ingresoForm').addEventListener('submit', async function(event) {
        event.preventDefault();

        // Validar que kmDia no sea "Error"
        if (kmDiaInput.value === 'Error') {
            alert('La diferencia entre Km Final y Km Inicial no puede ser negativa.');
            return;
        }

        enviarBtn.disabled = true;
        enviarBtn.textContent = 'Enviando datos...';
        enviarBtn.style.backgroundColor = '#ff9800'; // Naranja

        // Recoger los datos del formulario en el orden solicitado
        const ANIO = document.getElementById('anio').value;
        const MES = document.getElementById('mes').value;
        const NUM_UNIDAD = document.getElementById('numeroUnidad').value;
        const PILOTO = document.getElementById('piloto').value;
        const DIA = document.getElementById('numeroDia').value;
        const RUTA_RECORRIDA = document.getElementById('rutaRecorrida').value;
        const KM_INICIAL = document.getElementById('kmInicial').value;
        const KM_FINAL = document.getElementById('kmFinal').value;
        const KM_DIA = document.getElementById('kmDia').value;
        const OBSERVACIONES = document.getElementById('observaciones').value;
        const NO_VALE_COMB = document.getElementById('noValeCombustible').value;
        const GALONES = document.getElementById('galones').value;
        const VALORQTZ = document.getElementById('valorQuetzal').value;
        const fotoInput = document.getElementById('foto-recibo');
        let fotoFile = fotoInput.archivoSeleccionado || null;
        let fotoBase64 = '';
        if (fotoFile) {
            fotoBase64 = await fileToBase64(fotoFile);
        }

        // Construir los datos como un array en el orden requerido
        const fila = [
            ANIO,
            MES,
            NUM_UNIDAD,
            PILOTO,
            DIA,
            RUTA_RECORRIDA,
            KM_INICIAL,
            KM_FINAL,
            KM_DIA,
            OBSERVACIONES,
            NO_VALE_COMB,
            GALONES,
            VALORQTZ,
            fotoFile
        ];

        // --- ENVÍO ROBUSTO Y SIMPLE ---
        // Ejemplo usando Google Apps Script Web App (debes crear tu propio endpoint)
        // Reemplaza la URL por la de tu Web App de Google Apps Script
        // const url = 'https://script.google.com/macros/s/AKfycby8KLO-bxydNiIiMXh-GRIqZ2A-P_S6ayadPLrcK_ljcldDlTG-_VpFx29As5qDNsZjZQ/exec';
        // const url = 'https://script.google.com/macros/s/AKfycbxpoTulVAjFUoGrdsSKFkvy8thTyiikq-17EpvmfIll-bUYboW8hzvyTHu-LuMh_9fG6A/exec'; // Reemplaza por tu URL
        const url = 'https://script.google.com/macros/s/AKfycbx3R1R1XhTGh7ZboHxqTbd-WT6CJd4Z7o_hlPwc0jXH4QfzO8VctykLeJDKDwbTCNECSQ/exec';
        // // Usar FormData para enviar los datos como si fuera un formulario clásico
        const formData = new FormData();
        formData.append('ANIO', ANIO);
        formData.append('MES', MES);
        formData.append('NUM_UNIDAD', NUM_UNIDAD);
        formData.append('PILOTO', PILOTO);
        formData.append('DIA', DIA);
        formData.append('RUTA_RECORRIDA', RUTA_RECORRIDA);
        formData.append('KM_INICIAL', KM_INICIAL);
        formData.append('KM_FINAL', KM_FINAL);
        formData.append('KM_DIA', KM_DIA);
        formData.append('OBSERVACIONES', OBSERVACIONES);
        formData.append('NO_VALE_COMB', NO_VALE_COMB);
        formData.append('GALONES', GALONES);
        formData.append('VALORQTZ', VALORQTZ);
        formData.append('FOTO_RECIBO', fotoBase64); // <-- debe ser base64, no el archivo

        try {
            const response = await fetch(url, {
                method: 'POST',
                body: formData
            });
            if (response.ok) {
                alert('Datos enviados correctamente');
                clearForm();
                recargarAnio(); // <-- Recarga el año después de limpiar el formulario
                // Limpiar imagen seleccionada y previsualización
                document.getElementById('foto-recibo').value = '';
                document.getElementById('foto-recibo').archivoSeleccionado = null;
                document.getElementById('foto-recibo-preview').innerHTML = '';
            } else {
                alert('Error al enviar los datos');
            }
        } catch (error) {
            alert('Error de conexión al enviar los datos');
        } finally {
            enviarBtn.disabled = false;
            enviarBtn.textContent = 'Enviar Datos';
            enviarBtn.style.backgroundColor = ''; // Vuelve al color original
            toggleSubirImagenButton(); // Re-evaluate button state after submission
        }
    });

    // Convertir automáticamente a mayúsculas el campo rutaRecorrida
    const rutaRecorridaInput = document.getElementById('rutaRecorrida');
    const observacionesInput = document.getElementById('observaciones');
    if (rutaRecorridaInput) {
        rutaRecorridaInput.addEventListener('input', function () {
            this.value = this.value.toUpperCase();
        });
    }
    if (observacionesInput) {
        observacionesInput.addEventListener('input', function () {
            this.value = this.value.toUpperCase();
        });
    }

    // Foto del recibo: previsualización
    //const fotoInput = document.getElementById('foto-recibo');
    //const previewDiv = document.getElementById('foto-recibo-preview');
    // fotoInput.addEventListener('change', function() {
    //     previewDiv.innerHTML = '';
    //     if (this.files && this.files[0]) {
    //         const img = document.createElement('img');
    //         img.style.maxWidth = '200px';
    //         img.style.maxHeight = '200px';
    //         img.src = URL.createObjectURL(this.files[0]);
    //         previewDiv.appendChild(img);
    //     }
    // });
});

// --- View Management ---
function showView(viewId) {
    const views = document.querySelectorAll('.view');
    views.forEach(view => view.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');

    const buttons = document.querySelectorAll('.tab-button');
    buttons.forEach(button => button.classList.remove('active'));
    document.querySelector(`.tab-button[onclick="showView('${viewId}')"]`).classList.add('active');
}

// --- Ingreso Datos View Functions ---
function clearForm() {
    document.getElementById('ingresoForm').reset();
    document.getElementById('kmDia').value = '';
    // After clearing the form, re-evaluate the "Subir imagen" button state
    const noValeCombustibleInput = document.getElementById('noValeCombustible');
    const galonesInput = document.getElementById('galones');
    const valorQuetzalInput = document.getElementById('valorQuetzal');
    const abrirModalImagenBtn = document.getElementById('abrirModalImagen');

    // This ensures the button is disabled after a clear operation
    if (abrirModalImagenBtn) { // Check if the element exists
        abrirModalImagenBtn.disabled = true;
        abrirModalImagenBtn.style.backgroundColor = '#cccccc';
        abrirModalImagenBtn.style.cursor = 'not-allowed';
    }
}

// --- FUNCIONES PARA CONSULTAR GOOGLE SHEETS ---
// NOTA: Debes reemplazar la URL por la de tu Google Sheets publicada como CSV o usar una API propia.

// const SHEET_BASE_URL = ''; // Reemplaza por tu URL

async function fetchSheetData(sheetName) {
    // Reemplaza 'TU_WEB_APP_ID_GET' con la misma URL de tu Web App de Apps Script
    const url = `https://script.google.com/macros/s/AKfycbx3R1R1XhTGh7ZboHxqTbd-WT6CJd4Z7o_hlPwc0jXH4QfzO8VctykLeJDKDwbTCNECSQ/exec/exec?sheetName=${sheetName}`;

    //const url = `https://script.google.com/macros/s/AKfycbwSVZ7kx5VW4g-2366fizvKvltPlzol73z97nHShNHlH9hNwyU5XtEXTmF0mYilIdtNwg/exec/exec?sheetName=${sheetName}`;
    // const url = `https://script.google.com/macros/s/AKfycbxpoTulVAjFUoGrdsSKFkvy8thTyiikq-17EpvmfIll-bUYboW8hzvyTHu-LuMh_9fG6A/exec/exec?sheetName=${sheetName}`;
    // const url = `https://script.google.com/macros/s/AKfycbySTMdQFBdPyBMqkgTNf3cnR3gwg1W0NSpC5b2ufmiTpfoffjvj9YyRAwhthN4A637UQQ/exec/exec?sheetName=${sheetName}`;


    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json(); // La respuesta del Apps Script doGet es JSON
        return data;
    } catch (error) {
        console.error(`Error fetching data from sheet ${sheetName}:`, error);
        return []; // Retorna un array vacío en caso de error
    }
}

// --- Llenar selects en Ingreso de Datos ---
async function llenarSelectsIngresoDatos() {
    // UNIDADES
    const unidades = await fetchSheetData("UNIDADES");
    const numeroUnidadSelect = document.getElementById('numeroUnidad');
    numeroUnidadSelect.innerHTML = '<option value="">Seleccione una unidad</option>';
    unidades.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.numero;
        opt.textContent = u.numero;
        numeroUnidadSelect.appendChild(opt);
    });

    // PILOTOS
    const pilotos = await fetchSheetData("PILOTOS");
    const pilotoSelect = document.getElementById('piloto');
    pilotoSelect.innerHTML = '<option value="">Seleccione un piloto</option>';
    pilotos.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.nombre;
        opt.textContent = p.nombre;
        pilotoSelect.appendChild(opt);
    });
}

// --- Llenar selects en Ver Datos ---
async function llenarSelectsVerDatos() {
    // AÑO desde DATOS
    const datos = await fetchSheetData("DATOS");
    const anios = [...new Set(datos.map(d => d.anio))];
    const filterAnioSelect = document.getElementById('filterAnio');
    filterAnioSelect.innerHTML = '<option value="">Seleccione un año</option>';
    anios.forEach(anio => {
        const opt = document.createElement('option');
        opt.value = anio;
        opt.textContent = anio;
        filterAnioSelect.appendChild(opt);
    });

    // UNIDADES
    const unidades = await fetchSheetData("UNIDADES");
    const filterNumeroUnidadSelect = document.getElementById('filterNumeroUnidad');
    filterNumeroUnidadSelect.innerHTML = '<option value="">Seleccione una unidad</option>';
    unidades.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.numero;
        opt.textContent = u.numero;
        filterNumeroUnidadSelect.appendChild(opt);
    });
}

// --- Actualizar placa y piloto responsable en Ver Datos ---
async function actualizarPlacaYPiloto() {
    const unidadSeleccionada = document.getElementById('filterNumeroUnidad').value;
    const unidades = await fetchSheetData("UNIDADES");
    const unidad = unidades.find(u => u.numero === unidadSeleccionada);
    document.getElementById('placaUnidad').value = unidad ? unidad.placa : '';
    document.getElementById('pilotoResponsable').value = unidad ? unidad.piloto : '';
}

// --- Buscar datos y llenar tabla en Ver Datos ---
// --- Buscar datos y llenar tabla en Ver Datos ---
async function buscarDatos() {
    const btnBuscar = document.getElementById('btnBuscarDatos');
    btnBuscar.disabled = true;
    btnBuscar.textContent = 'Buscando datos...';
    btnBuscar.style.backgroundColor = '#ff9800'; // Naranja

    const anio = document.getElementById('filterAnio').value;
    const mes = document.getElementById('filterMes').value;
    const numeroUnidad = document.getElementById('filterNumeroUnidad').value;

    const tbody = document.querySelector('#tablaRutas tbody');
    tbody.innerHTML = '';
    for (let dia = 1; dia <= 31; dia++) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${dia}</td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td> `;
        tbody.appendChild(tr);
    }

    const datos = await fetchSheetData("DATOS");
    const datosFiltrados = datos.filter(d =>
        d.anio == anio &&
        d.mes == mes &&
        d.numeroUnidad == numeroUnidad
    );

    datosFiltrados.forEach(dato => {
        const dia = parseInt(dato.numeroDia, 10);
        if (dia >= 1 && dia <= 31) {
            const fila = tbody.children[dia - 1];
            if (fila) {
                fila.children[1].textContent = dato.rutaRecorrida || '';
                fila.children[2].textContent = dato.kmInicial || '';
                fila.children[3].textContent = dato.kmFinal || '';
                fila.children[4].textContent = dato.kmDia || '';
                fila.children[5].textContent = dato.noValeCombustible || '';
                fila.children[6].textContent = dato.galones || '';
                fila.children[7].textContent = dato.valorQuetzal || '';
                fila.children[8].textContent = dato.observaciones || '';
                fila.children[9].textContent = dato.piloto || '';

                // Mostrar botón solo si hay datos de combustible y una URL de recibo
                const tieneCombustible = (parseFloat(dato.galones) > 0 || parseFloat(dato.valorQuetzal) > 0) && dato.fotoRecibo;
                if (tieneCombustible) {
                    const btnVerRecibo = document.createElement('button');
                    btnVerRecibo.textContent = 'VER RECIBO';
                    btnVerRecibo.className = 'btn-ver-recibo';
                    btnVerRecibo.onclick = function() {
                        window.open(dato.fotoRecibo, '_blank');
                    };
                    fila.children[10].appendChild(btnVerRecibo);
                }
            }
        }
    });

    // Calcular los totales y la media
    let totalKm = 0;
    let totalGalones = 0;
    let totalValorQtz = 0;

    datosFiltrados.forEach(dato => {
        totalKm += parseFloat(dato.kmDia) || 0;
        totalGalones += parseFloat(dato.galones) || 0;
        totalValorQtz += parseFloat(dato.valorQuetzal) || 0;
    });

    document.getElementById('kmMensual').value = totalKm.toFixed(2);
    document.getElementById('galonesMensual').value = totalGalones.toFixed(2);
    document.getElementById('valorQtzMensual').value = totalValorQtz.toFixed(2);
    document.getElementById('mediaKmGalon').value = totalGalones > 0 ? (totalKm / totalGalones).toFixed(2) : '0.00';

    // Al finalizar la búsqueda:
    btnBuscar.disabled = false;
    btnBuscar.textContent = 'Buscar Datos';
    btnBuscar.style.backgroundColor = ''; // Vuelve al color original

    // Mostrar mensaje de éxito
    const mensaje = document.createElement('div');
    mensaje.textContent = 'Datos encontrados exitosamente';
    mensaje.style.color = 'green';
    mensaje.style.margin = '10px 0';
    mensaje.style.fontWeight = 'bold';

    // Coloca el mensaje arriba de la tabla
    const tablaContainer = document.querySelector('.table-container');
    if (tablaContainer) {
        // Elimina mensajes anteriores
        const prevMsg = document.getElementById('msgDatosEncontrados');
        if (prevMsg) prevMsg.remove();
        mensaje.id = 'msgDatosEncontrados';
        tablaContainer.parentNode.insertBefore(mensaje, tablaContainer);
        setTimeout(() => mensaje.remove(), 2500); // Quita el mensaje después de 2.5 segundos
    }
}

// --- DESCARGA A EXCEL ---
document.getElementById('descargarExcel').addEventListener('click', function () {
    // Obtener filtros y resumenes
    const anio = document.getElementById('filterAnio').value;
    const mes = document.getElementById('filterMes').value;
    const unidad = document.getElementById('filterNumeroUnidad').value;
    const placa = document.getElementById('placaUnidad').value;
    const piloto = document.getElementById('pilotoResponsable').value;

    const kmMensual = document.getElementById('kmMensual').value;
    const galonesMensual = document.getElementById('galonesMensual').value;
    const valorQtzMensual = document.getElementById('valorQtzMensual').value;
    const mediaKmGalon = document.getElementById('mediaKmGalon').value;

    // Obtener la tabla
    const tabla = document.getElementById('tablaRutas');
    const ws_data = [];

    // Agregar filtros arriba
    ws_data.push(['Filtros']);
    ws_data.push(['Año', anio]);
    ws_data.push(['Mes', mes]);
    ws_data.push(['Unidad', unidad]);
    ws_data.push(['Placa', placa]);
    ws_data.push(['Piloto Responsable', piloto]);
    ws_data.push([]); // Línea vacía

    // Agregar resumenes
    ws_data.push(['Resumen Mensual']);
    ws_data.push(['Km Mensual', kmMensual]);
    ws_data.push(['Galones Mensual', galonesMensual]);
    ws_data.push(['ValorQTZ Mensual', valorQtzMensual]);
    ws_data.push(['MEDIA KM/GALON', mediaKmGalon]);
    ws_data.push([]); // Línea vacía

    // Agregar encabezados de la tabla
    const headers = [];
    tabla.querySelectorAll('thead th').forEach(th => headers.push(th.textContent));
    ws_data.push(headers);

    // Agregar filas de la tabla
    tabla.querySelectorAll('tbody tr').forEach(tr => {
        const row = [];
        tr.querySelectorAll('td').forEach(td => row.push(td.textContent));
        ws_data.push(row);
    });

    // Crear hoja y libro
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Hoja de Rutas");

    // Descargar
    XLSX.writeFile(wb, `Hoja_de_Rutas_${anio}_${mes}_${unidad}.xlsx`);
});

// Convierte cualquier archivo de imagen a un Blob JPG usando un canvas
async function convertirImagenAJPG(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                
                // --- Lógica de redimensionamiento ---
                const MAX_WIDTH = 1024; // Puedes ajustar este valor según necesites
                const MAX_HEIGHT = 1024;
                
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height = height * (MAX_WIDTH / width);
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width = width * (MAX_HEIGHT / height);
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                // --- Fin de la lógica de redimensionamiento ---

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    blob => resolve(blob),
                    'image/jpeg',
                    0.7 // Calidad del 70%, un buen punto de partida para compresión.
                );
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Convierte un archivo a base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result.split(',')[1]); // Solo la parte base64
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function mostrarImagenModal(src) {
    const modal = document.getElementById('modalImagen');
    const modalImg = document.getElementById('modalImg');
    modalImg.src = src;
    modal.style.display = 'flex';
}

// Cierra el modal al hacer clic fuera de la imagen
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('modalImagen');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
});

function recargarAnio() {
    const anioInput = document.getElementById('anio');
    if (anioInput) {
        anioInput.value = new Date().getFullYear();
    }
}

