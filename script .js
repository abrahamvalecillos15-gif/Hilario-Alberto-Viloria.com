/* =====================================================
   SISTEMA DE INSCRIPCIÓN ESCOLAR - LOGICA JAVASCRIPT (NUBE)
   ===================================================== */

let estudiantes = [];
let estudianteLogueado = null;
let añoEscolarActual = 2026; 

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando sistema escolar profesional 2026 en la nube...');
    
    const añoActualDisplay = document.getElementById('año-actual');
    if(añoActualDisplay) añoActualDisplay.textContent = añoEscolarActual;
    
    const badgeAño = document.getElementById('badge-año');
    if(badgeAño) badgeAño.textContent = añoEscolarActual;
    
    configurarEventos();
    verificarConexion();
});

// Cargar datos en cuanto Firebase esté inicializado y listo
window.addEventListener('firebase-ready', () => {
    cargarEstudiantesDesdeNube();
});

/**
 * Carga todos los estudiantes registrados desde Firebase Realtime Database
 */
async function cargarEstudiantesDesdeNube() {
    try {
        if (!window.db || !window.rtGet) {
            setTimeout(cargarEstudiantesDesdeNube, 500);
            return;
        }

        const snapshot = await window.rtGet(window.rtRef(window.db, 'estudiantes'));
        estudiantes = [];
        
        if (snapshot.exists()) {
            const data = snapshot.val();
            Object.keys(data).forEach(firebaseKey => {
                estudiantes.push({
                    firebaseKey: firebaseKey, // Llave única para actualizar o borrar en la nube
                    ...data[firebaseKey]
                });
            });
        }

        actualizarEstadisticas();
        verificarActualizacionGrados();
        
        const seccionLista = document.getElementById('lista');
        if (seccionLista && seccionLista.classList.contains('activa')) {
            cargarListaEstudiantes();
        }
        
        console.log("☁️ Estudiantes sincronizados con la nube con éxito.");
    } catch (error) {
        console.error("Error al cargar datos desde la nube:", error);
        mostrarModal("❌ Error de conexión: No se pudieron sincronizar los datos con la nube.");
    }
}

/**
 * Control del Enrutamiento y Navegación Visual entre Paneles
 */
function mostrarSeccion(seccionId) {
    const secciones = document.querySelectorAll('.seccion');
    secciones.forEach(sec => sec.classList.remove('activa'));
    
    const botonesNav = document.querySelectorAll('.btn-nav');
    botonesNav.forEach(btn => btn.classList.remove('active'));
    
    const seccionObjetivo = document.getElementById(seccionId);
    if (!seccionObjetivo) return;
    
    seccionObjetivo.classList.add('activa');
    
    botonesNav.forEach(btn => {
        const clickAttr = btn.getAttribute('onclick');
        if (clickAttr && clickAttr.includes(`'${seccionId}'`)) {
            btn.classList.add('active');
        }
    });
    
    if (seccionId === 'lista') {
        cargarListaEstudiantes();
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Agrupador y Vinculador de Eventos Listeners del Sistema
 */
function configurarEventos() {
    configurarCalculoEdad();
    configurarAsignacionSalon();
    configurarFormularioInscripcion();
    configurarLogin();
    configurarBuscador();
    
    window.addEventListener('online', verificarConexion);
    window.addEventListener('offline', verificarConexion);
}

/**
 * Escucha la fecha de nacimiento y procesa la edad exacta del estudiante
 */
function configurarCalculoEdad() {
    const fechaInput = document.getElementById('fecha-nacimiento');
    const edadInput = document.getElementById('edad');
    if (!fechaInput || !edadInput) return;
    
    fechaInput.addEventListener('change', function() {
        if (!this.value) {
            edadInput.value = '';
            return;
        }
        
        const [year, month, day] = this.value.split('-').map(Number);
        const today = new Date();
        
        let edad = today.getFullYear() - year;
        const mesDiferencia = today.getMonth() - (month - 1); 
        
        if (mesDiferencia < 0 || (mesDiferencia === 0 && today.getDate() < day)) {
            edad--;
        }
        
        if (edad >= 4 && edad <= 25) {
            edadInput.value = `${edad} años`;
        } else if (edad < 4) {
            edadInput.value = 'Debe tener al menos 4 años';
        } else {
            edadInput.value = 'Edad fuera del rango';
        }
    });
}

/**
 * Calcula de manera programática el aula física asignada al alumno
 */
function configurarAsignacionSalon() {
    const gradoSelect = document.getElementById('grado');
    const seccionSelect = document.getElementById('seccion');
    const salonInput = document.getElementById('salon');
    if (!gradoSelect || !seccionSelect || !salonInput) return;
    
    function actualizarSalon() {
        const grado = gradoSelect.value;
        const seccion = seccionSelect.value;
        
        if (grado && seccion) {
            const gradoNum = grado.match(/\d+/)?.[0] || '1';
            const salonMap = { 'A': '1', 'B': '2', 'C': '3' };
            salonInput.value = `${gradoNum}0${salonMap[seccion] || '1'}`;
        } else {
            salonInput.value = '';
        }
    }
    
    gradoSelect.addEventListener('change', actualizarSalon);
    seccionSelect.addEventListener('change', actualizarSalon);
}

function actualizarEstadisticas() {
    const total = document.getElementById('total-estudiantes');
    if(total) total.textContent = estudiantes.length;
}

function verificarConexion() {
    const status = document.getElementById('connection-status');
    const texto = document.getElementById('status-text');
    if(status && texto) {
        if (navigator.onLine) {
            status.className = 'status-indicator online';
            texto.textContent = 'Conectado';
        } else {
            status.className = 'status-indicator offline';
            texto.textContent = 'Sin conexión';
        }
    }
}

/**
 * Algoritmo automatizado de Promoción de Grados Académicos en la nube
 */
async function verificarActualizacionGrados() {
    const añoGuardado = localStorage.getItem('añoEscolar');
    if (añoGuardado && parseInt(añoGuardado) < añoEscolarActual) {
        await actualizarGradosEstudiantes();
    }
    localStorage.setItem('añoEscolar', añoEscolarActual.toString());
}

async function actualizarGradosEstudiantes() {
    let cambios = 0;
    for (let est of estudiantes) {
        let nuevoGrado = est.grado;
        if (est.grado && est.grado !== '6to Grado' && est.grado !== 'Graduado') {
            const numGrado = parseInt(est.grado.match(/\d+/)?.[0] || '1');
            const grados = ['', '2do Grado', '3er Grado', '4to Grado', '5to Grado', '6to Grado'];
            nuevoGrado = grados[numGrado] || 'Graduado';
        } else if (est.grado === '6to Grado') {
            nuevoGrado = 'Graduado';
        }

        if (nuevoGrado !== est.grado) {
            est.gradoAnterior = est.grado;
            est.grado = nuevoGrado;
            est.añoEscolar = añoEscolarActual;
            cambios++;
            if (est.firebaseKey) {
                await window.rtSet(window.rtRef(window.db, `estudiantes/${est.firebaseKey}`), est);
            }
        }
    }
    
    if (cambios > 0) {
        await cargarEstudiantesDesdeNube();
        mostrarModal(`🎓 ¡Bienvenido al Año Escolar ${añoEscolarActual}!\nSe promovieron ${cambios} estudiantes automáticamente en la nube.`);
    }
}

/**
 * Controlador de Procesamiento y Registro del Formulario directo a la Nube
 */
function configurarFormularioInscripcion() {
    const form = document.getElementById('form-inscripcion');
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const cedula = document.getElementById('tutor-cedula').value.trim().toUpperCase();
        const regex = /^[VEJPG]-\d{5,8}$/;
        
        if (!regex.test(cedula)) {
            mostrarModal('⚠️ Estructura de cédula del tutor inválida.<br>Por favor use el formato: V-12345678');
            return;
        }
        
        const nombre = document.getElementById('nombre').value.trim();
        const apellido = document.getElementById('apellido').value.trim();
        
        const existe = estudiantes.some(est => est.nombre.toLowerCase() === nombre.toLowerCase() && est.apellido.toLowerCase() === apellido.toLowerCase());
        if (existe) {
            mostrarModal('⚠️ Alerta: Ya se encuentra registrado un estudiante con el mismo nombre y apellido en la base de datos.');
            return;
        }
        
        const nuevoEstudiante = crearObjetoEstudiante();
        
        try {
            // Guardado automático en Realtime Database usando push() para generar ID único
            const nuevaEstudianteRef = window.rtPush(window.rtRef(window.db, 'estudiantes'));
            await window.rtSet(nuevaEstudianteRef, nuevoEstudiante);
            
            await cargarEstudiantesDesdeNube();
            
            mostrarModal(`
                <div style="text-align: center;">
                    <span style="font-size: 3rem;">🎉</span>
                    <h3 style="color: #28a745; margin-top: 10px;">¡Inscripción Guardada en la Nube!</h3>
                    <p style="margin: 15px 0; color: #333;">El alumno ha quedado registrado en el servidor para el período <strong>${nuevoEstudiante.añoEscolar}</strong>.</p>
                    <div style="background: #f8f9fa; padding: 12px; border-radius: 6px; border: 1px dashed #ced4da; text-align: left; max-width: 320px; margin: 0 auto;">
                        <p style="margin: 5px 0; font-family: monospace;"><strong>👤 Usuario:</strong> <span style="color: #e83e8c; font-weight:bold;">${nuevoEstudiante.usuario}</span></p>
                        <p style="margin: 5px 0; font-family: monospace;"><strong>🔑 Contraseña:</strong> <span style="color: #e83e8c; font-weight:bold;">${nuevoEstudiante.usuario}</span></p>
                    </div>
                    <p style="font-size: 0.85em; color: #6c757d; margin-top: 15px;">⚠️ Copie sus credenciales. Serán obligatorias para ingresar al Panel.</p>
                </div>
            `);
            
            form.reset();
            mostrarSeccion('inicio');
        } catch (error) {
            console.error("Error al guardar en Firebase:", error);
            mostrarModal("❌ Error al procesar la inscripción en la base de datos remota.");
        }
    });
}

function crearObjetoEstudiante() {
    const nombre = document.getElementById('nombre').value.trim();
    const apellido = document.getElementById('apellido').value.trim();
    const usuarioClean = (nombre + apellido).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s/g, '');
    
    return {
        id: Date.now(),
        nombre: nombre,
        apellido: apellido,
        fechaNacimiento: document.getElementById('fecha-nacimiento').value,
        edad: document.getElementById('edad').value,
        grado: document.getElementById('grado').value,
        seccion: document.getElementById('seccion').value,
        salon: document.getElementById('salon').value,
        sangre: document.getElementById('sangre').value,
        tallaCamisa: document.getElementById('talla-camisa').value,
        tallaPantalon: document.getElementById('talla-pantalon').value,
        tallaZapatos: document.getElementById('talla-zapatos').value,
        alergias: document.getElementById('alergias').value.trim() || 'Ninguna',
        medicamentos: document.getElementById('medicamentos').value.trim() || 'Ninguno',
        enfermedades: document.getElementById('enfermedades').value.trim() || 'Ninguna',
        tutorNombre: document.getElementById('tutor-nombre').value.trim(),
        tutorApellido: document.getElementById('tutor-apellido').value.trim(),
        cedulaTutor: document.getElementById('tutor-cedula').value.trim().toUpperCase(),
        tutorTelefono: document.getElementById('tutor-telefono').value.trim(),
        tutorCorreo: document.getElementById('tutor-correo').value.trim(),
        tutorParentesco: document.getElementById('tutor-parentesco').value,
        tutorDireccion: document.getElementById('tutor-direccion').value.trim() || 'No especificada',
        usuario: usuarioClean,
        password: usuarioClean,
        fechaInscripcion: new Date().toLocaleDateString('es-VE'),
        añoEscolar: añoEscolarActual
    };
}

/**
 * Autenticación de Usuarios contra la data en memoria cargada desde Firebase
 */
function configurarLogin() {
    const form = document.getElementById('form-login');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const usuarioInput = document.getElementById('login-usuario').value.trim().toLowerCase().replace(/\s/g, '');
        const passwordInput = document.getElementById('login-password').value.trim().toLowerCase().replace(/\s/g, '');
        
        const estudiante = estudiantes.find(est => est.usuario === usuarioInput);
        
        if (!estudiante) {
            mostrarModal('❌ Acceso denegado: El usuario indicado no figura en los registros.');
            return;
        }
        if (estudiante.password !== passwordInput) {
            mostrarModal('❌ Acceso denegado: Contraseña incorrecta.');
            return;
        }
        
        estudianteLogueado = estudiante;
        cargarPanelEstudiante(estudiante);
        mostrarSeccion('panel');
        form.reset();
    });
}

function cargarPanelEstudiante(est) {
    document.getElementById('panel-nombre').textContent = est.nombre;
    document.getElementById('panel-apellido').textContent = est.apellido;
    document.getElementById('panel-edad').textContent = est.edad;
    document.getElementById('panel-fecha').textContent = formatDate(est.fechaNacimiento);
    document.getElementById('panel-grado').textContent = est.grado;
    document.getElementById('panel-seccion').textContent = 'Sección ' + est.seccion;
    document.getElementById('panel-salon').textContent = est.salon || 'Por asignar';
    document.getElementById('panel-sangre').textContent = est.sangre || 'No registrado';
    document.getElementById('panel-talla-camisa').textContent = est.tallaCamisa || '-';
    document.getElementById('panel-talla-pantalon').textContent = est.tallaPantalon || '-';
    document.getElementById('panel-talla-zapatos').textContent = est.tallaZapatos || '-';
    
    document.getElementById('panel-alergias').textContent = est.alergias;
    document.getElementById('panel-medicamentos').textContent = est.medicamentos;
    document.getElementById('panel-enfermedades').textContent = est.enfermedades;

    document.getElementById('panel-tutor-nombre').textContent = `${est.tutorNombre} ${est.tutorApellido}`;
    document.getElementById('panel-tutor-cedula').textContent = est.cedulaTutor;
    document.getElementById('panel-tutor-telefono').textContent = est.tutorTelefono;
    document.getElementById('panel-tutor-correo').textContent = est.tutorCorreo;
    document.getElementById('panel-tutor-parentesco').textContent = est.tutorParentesco;
    document.getElementById('panel-tutor-direccion').textContent = est.tutorDireccion;
}

function cerrarSesion() {
    estudianteLogueado = null;
    mostrarSeccion('inicio');
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

function configurarBuscador() {
    const form = document.getElementById('form-buscar');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const busqueda = document.getElementById('busqueda-input').value.trim().toLowerCase();
        
        if (!busqueda) {
            mostrarModal('⚠️ Ingrese un criterio válido de búsqueda.');
            return;
        }
        
        const resultados = estudiantes.filter(est => 
            est.nombre.toLowerCase().includes(busqueda) ||
            est.apellido.toLowerCase().includes(busqueda) ||
            est.cedulaTutor.toLowerCase().includes(busqueda) ||
            est.usuario.toLowerCase().includes(busqueda)
        );
        
        mostrarResultados(resultados);
    });
}

function mostrarResultados(resultados) {
    const container = document.getElementById('resultados-busqueda');
    if (!container) return;
    
    if (resultados.length === 0) {
        container.innerHTML = '<p class="lista-vacia">🔍 No se localizaron estudiantes.</p>';
        return;
    }
    
    container.innerHTML = resultados.map(est => `
        <div class="resultado-item" style="border-left: 4px solid #007bff; padding: 15px; margin: 10px 0; background: #f9f9f9; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <h4><i class="fas fa-user-graduate"></i> ${est.nombre} ${est.apellido}</h4>
                <p><strong>Grado:</strong> ${est.grado} — Sección "${est.seccion}"</p>
                <p><strong>Tutor:</strong> ${est.tutorNombre} (${est.cedulaTutor})</p>
            </div>
            <div>
                <button class="btn btn-primary" onclick="verPlanillaDesdeBusqueda(${est.id})" style="margin-right: 5px; padding: 8px 12px;">
                    <i class="fas fa-eye"></i> Ver Planilla
                </button>
                <button class="btn btn-danger" onclick="eliminarEstudiante(${est.id}, '${est.nombre} ${est.apellido}')" style="background-color: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">
                    <i class="fas fa-user-minus"></i> Retirar
                </button>
            </div>
        </div>
    `).join('');
}

function verPlanillaDesdeBusqueda(idEstudiante) {
    const est = estudiantes.find(e => e.id === idEstudiante);
    if(est) {
        cargarPanelEstudiante(est);
        mostrarSeccion('panel');
    }
}

function cargarListaEstudiantes() {
    const container = document.getElementById('lista-estudiantes');
    if (!container) return;
    
    if (estudiantes.length === 0) {
        container.innerHTML = '<p class="lista-vacia">📋 No se registran alumnos inscritos.</p>';
        return;
    }
    
    const ordenados = [...estudiantes].sort((a, b) => a.apellido.localeCompare(b.apellido));
    
    container.innerHTML = ordenados.map((est, i) => `
        <div class="lista-item" style="padding: 12px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <h4>${i + 1}. ${est.apellido}, ${est.nombre}</h4>
                <p style="font-size: 0.9em; color: #555;">Grado: ${est.grado} | Sección: ${est.seccion}</p>
            </div>
            <div>
                <button class="btn btn-primary" onclick="verPlanillaDesdeBusqueda(${est.id})" style="padding: 6px 10px; font-size: 0.85em; margin-right: 5px;">
                    <i class="fas fa-eye"></i> Ver
                </button>
                <button class="btn btn-danger" onclick="eliminarEstudiante(${est.id}, '${est.nombre} ${est.apellido}')" style="background-color: #dc3545; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 0.85em;">
                    <i class="fas fa-trash"></i> Retirar
                </button>
            </div>
        </div>
    `).join('');
}

/**
 * Eliminación/Retiro de expedientes directamente en la nube
 */
async function eliminarEstudiante(idEstudiante, nombreCompleto) {
    const confirmarRetiro = confirm(`⚠️ ADVERTENCIA:\n¿Está seguro de retirar al estudiante "${nombreCompleto}"?\nEsta acción borrará de inmediato su ficha de la nube.`);
    
    if (confirmarRetiro) {
        try {
            const est = estudiantes.find(e => e.id === idEstudiante);
            if (est && est.firebaseKey) {
                // Borrado del nodo específico en Realtime Database
                await window.rtRemove(window.rtRef(window.db, `estudiantes/${est.firebaseKey}`));
                await cargarEstudiantesDesdeNube();
                
                mostrarModal(`<p style="color: #dc3545; font-weight: bold; text-align: center; margin: 0;">❌ El estudiante "${nombreCompleto}" ha sido dado de baja en la nube de forma permanente.</p>`);
                
                const containerBusqueda = document.getElementById('resultados-busqueda');
                if(containerBusqueda) containerBusqueda.innerHTML = "";
            }
        } catch (error) {
            console.error("Error al eliminar en Firebase:", error);
            mostrarModal("❌ Error: No se pudo eliminar el expediente del servidor.");
        }
    }
}

function imprimirLista() { window.print(); }
function imprimirDatos() { window.print(); }

function mostrarModal(mensaje) {
    const modal = document.getElementById('modal');
    const modalMensaje = document.getElementById('modal-mensaje');
    if (modal && modalMensaje) {
        modalMensaje.innerHTML = mensaje; 
        modal.style.display = 'flex';
    }
}

function cerrarModalDirecto() {
    const modal = document.getElementById('modal');
    if (modal) modal.style.display = 'none';
}

function cerrarModal(event) {
    const modal = document.getElementById('modal');
    if (event.target === modal) {
        cerrarModalDirecto();
    }
}

// Exposición global de funciones para interactuar con los eventos onclick del HTML
window.mostrarSeccion = mostrarSeccion;
window.cerrarSesion = cerrarSesion;
window.imprimirLista = imprimirLista;
window.imprimirDatos = imprimirDatos;
window.eliminarEstudiante = eliminarEstudiante;
window.verPlanillaDesdeBusqueda = verPlanillaDesdeBusqueda;
window.cerrarModalDirecto = cerrarModalDirecto;
window.cerrarModal = cerrarModal;
