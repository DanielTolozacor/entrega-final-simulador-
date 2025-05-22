const reservationsList = document.getElementById("reservations");
const reservationForm = document.getElementById("reservationForm");
const reservationFormSection = document.getElementById("reservationFormSection");
const ticketDiv = document.getElementById("ticketReserva");
const reservationsTotal = document.getElementById("reservationsTotal");
const ADMIN_PASSWORD = "aprobado";
const HOURS = [
    "09:00", "10:00", "11:00", "12:00", "13:00", "14:00",
    "15:00", "16:00", "17:00", "18:00", "19:00", "20:00",
    "21:00", "22:00"
];
let claseSeleccionada = null;

// Oculta el formulario al cargar la página
reservationFormSection.style.display = 'none';

// Mostrar el formulario solo después de elegir una clase y poner el título de la clase seleccionada
document.querySelectorAll('.clase-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        reservationFormSection.style.display = 'block';
        reservationForm.reset();
        claseSeleccionada = btn.dataset.clase;
        // Usar backticks para el título
        document.querySelector('#reservationFormSection h2').innerHTML = `Reserva tu Clase: <span>${btn.textContent}</span>`;
    });
});

// Llenar horarios disponibles usando backticks para las opciones
function fillAvailableHours(dateValue, reservedIdx, isEdit = false) {
    const dateInput = isEdit ? document.getElementById("editDate") : document.getElementById("date");
    const timeSelect = isEdit ? document.getElementById("editTime") : document.getElementById("time");
    const date = dateValue || (dateInput ? dateInput.value : "");
    if (!timeSelect || !date) return;
    const reserved = getReservations().filter((r, i) => r.date === date && i !== reservedIdx).map(r => r.time);
    const todayStr = new Date().toISOString().slice(0, 10);
    let options = "";
    let available = false;
    HOURS.forEach(hour => {
        let show = true;
        if (date === todayStr && parseInt(hour) <= new Date().getHours()) show = false;
        if (!reserved.includes(hour) && show) {
            options += `<option value="${hour}">${hour}</option>`;
            available = true;
        }
    });
    if (!available) {
        timeSelect.innerHTML = `<option value="">No hay horarios disponibles</option>`;
        timeSelect.disabled = true;
    } else {
        timeSelect.innerHTML = options;
        timeSelect.disabled = false;
    }
}
document.getElementById("date").addEventListener("change", () => fillAvailableHours());

// Mostrar reservas y botones admin usando backticks
function renderReservations() {
    const reservas = getReservations();
    const t = textos[userLang];
    if (!reservas.length) {
        reservationsList.innerHTML = `<li>${t.noReservas || "No hay reservas hechas."}</li>`;
        return;
    }
    reservationsList.innerHTML = reservas.map((r, idx) => `
        <li>
            <input type="checkbox" class="reserva-check" data-idx="${idx}">
            <button class="edit-btn" data-idx="${idx}">${t.modificar}</button>
            ${r.name} | ${r.clase} | ${r.date} | ${r.time} | ${r.phone}
        </li>
    `).join('');
}

// SweetAlert2 para clave admin
function pedirClaveAdmin(callback, accion) {
    Swal.fire({
        title: 'Contraseña de administrador',
        input: 'password',
        inputLabel: `Ingrese la contraseña para ${accion}`,
        inputPlaceholder: 'Contraseña',
        showCancelButton: true,
        confirmButtonText: 'Aceptar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed && result.value === ADMIN_PASSWORD) {
            callback();
        } else if (result.isConfirmed) {
            Swal.fire(textos[userLang].alertaClaveIncorrecta, `No se puede ${accion} la reserva.`, 'error');
        }
    });
}

// Mostrar ticket de reserva usando backticks
function mostrarTicket(name, phone, date, clase, time) {
    const t = textos[userLang];
    Swal.fire({
        icon: 'success',
        title: t.tituloTicket,
        html: `
            <p style="margin-bottom:10px;">${t.alertaConfirmarPago}</p>
            <div style="text-align:left;">
                <strong>${t.nombre}</strong> ${name}<br>
                <strong>${t.telefono}</strong> ${phone}<br>
                <strong>${t.clase || "Clase:"}</strong> ${clase}<br>
                <strong>${t.fecha}</strong> ${date}<br>
                <strong>${t.horario}</strong> ${time}
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: t.alertaPagar,
        cancelButtonText: t.alertaCancelar
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({
                icon: 'success',
                title: t.alertaClaseAgendada,
                text: t.alertaReservaExitosa,
                confirmButtonText: 'Aceptar'
            });
        } else if (result.dismiss === Swal.DismissReason.cancel) {
            Swal.fire({
                icon: 'info',
                title: t.alertaCancelado,
                confirmButtonText: 'Aceptar'
            });
        }
    });
}

// Manejo del formulario de reserva
reservationForm.onsubmit = function(event) {
    event.preventDefault();
    const name = document.getElementById("name").value;
    const phone = document.getElementById("phone").value;
    const dateValue = document.getElementById("date").value;
    const time = document.getElementById("time").value;
    if (!claseSeleccionada) return alert("Por favor, selecciona una clase antes de reservar.");
    if (!validarNombre(name)) return alert(textos[userLang].alertaNombreInvalido || "Nombre inválido.");
    if (!validarTelefono(phone)) return alert(textos[userLang].alertaTelefonoInvalido || "Teléfono inválido.");
    if (!time) return alert("Por favor, selecciona un horario disponible.");
    const now = new Date();
    const selectedDateTime = new Date(`${dateValue}T${time}`);
    if (selectedDateTime <= now) return alert("Solo puedes reservar horarios futuros.");
    const result = createReservation(name, phone, dateValue, claseSeleccionada, time);
    if (result) {
        renderReservations();
        reservationForm.reset();
        fillAvailableHours();
        mostrarTicket(name, phone, dateValue, claseSeleccionada, time);
    } else {
        alert("Datos inválidos o reserva duplicada.");
    }
};

// --- MODAL DE EDICIÓN ---
function crearModalEdicion() {
    if (document.getElementById("modalEdicion")) return;
    const modal = document.createElement("div");
    modal.id = "modalEdicion";
    modal.style = "position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;";
    modal.innerHTML = `
        <div id="modalContenido" style="background:#222;padding:30px 20px 20px 20px;border-radius:10px;min-width:300px;box-shadow:0 0 20px #000;position:relative;">
            <h3 style="color:#e53935;margin-top:0;">Editar Reserva</h3>
            <form id="formEditarReserva" class="admin-edit">
                <label for="editName">Nombre:</label>
                <input type="text" id="editName" required style="display:block;width:100%;margin-bottom:10px;">
                <label for="editPhone">Teléfono:</label>
                <input type="tel" id="editPhone" required style="display:block;width:100%;margin-bottom:10px;">
                <label for="editDate">Fecha:</label>
                <input type="date" id="editDate" required style="display:block;width:100%;margin-bottom:10px;">
                <label for="editTime">Horario:</label>
                <select id="editTime" required style="display:block;width:100%;margin-bottom:10px;"></select>
                <button type="submit" style="margin-right:10px;">Guardar</button>
                <button type="button" id="cancelarEdicion">Cancelar</button>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
}

function editarReserva(idx) {
    crearModalEdicion();
    const modal = document.getElementById("modalEdicion");
    modal.style.display = "flex";
    const reserva = getReservations()[idx];
    if (!reserva) return;
    document.getElementById("editName").value = reserva.name;
    document.getElementById("editPhone").value = reserva.phone;
    document.getElementById("editDate").value = reserva.date;
    fillAvailableHours(reserva.date, idx, true);
    document.getElementById("editTime").value = reserva.time;
    document.getElementById("editDate").onchange = function() {
        fillAvailableHours(this.value, idx, true);
    };
    document.getElementById("cancelarEdicion").onclick = function() {
        modal.style.display = "none";
    };
    document.getElementById("formEditarReserva").onsubmit = function(e) {
        e.preventDefault();
        const name = document.getElementById("editName").value;
        const phone = document.getElementById("editPhone").value;
        const dateValue = document.getElementById("editDate").value;
        const time = document.getElementById("editTime").value;
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/.test(name)) return alert("El nombre solo puede contener letras y espacios.");
        if (!/^[\d+\s]+$/.test(phone)) return alert("El teléfono solo puede contener números, espacios y el signo +.");
        if (!time) return alert("Por favor, selecciona un horario disponible.");
        const now = new Date();
        const selectedDateTime = new Date(`${dateValue}T${time}`);
        if (selectedDateTime <= now) return alert("Solo puedes reservar horarios futuros.");
        const all = getReservations();
        if (all.some((r, i) => i !== idx && r.date === dateValue && r.time === time))
            return alert("Ya existe una reserva para esa fecha y horario.");
        all[idx] = { name, phone, date: dateValue, clase: reserva.clase, time };
        modal.style.display = "none";
        renderReservations();
        fillAvailableHours();
        mostrarTicket(name, phone, dateValue, reserva.clase, time);
    };
}

// Validación reutilizable
function validarNombre(name) {
    return /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/.test(name);
}
function validarTelefono(phone) {
    return /^[\d+\s]+$/.test(phone);
}

// Traducción de textos
const textos = {
    es: {
        titulo: "Reservas de Clases de Baile",
        clases: "Clases Disponibles",
        reservar: "Reserva tu Clase",
        nombre: "Nombre:",
        telefono: "Teléfono:",
        fecha: "Fecha:",
        horario: "Horario:",
        reservarBtn: "Reservar",
        reservasActuales: "Reservas Actuales",
        total: "Total de reservas:",
        ticket: "Reserva confirmada:",
        pagar: "Pagar",
        cancelar: "Cancelar",
        modificar: "Modificar",
        borrarSeleccionadas: "Borrar seleccionadas",
        seleccionarTodas: "Seleccionar todas",
        alertaReservaExitosa: "¡Tu clase ha sido agendada exitosamente!",
        alertaClaseAgendada: "Clase agendada",
        alertaCancelado: "El tango siempre te espera",
        alertaSeleccionaReserva: "Selecciona al menos una reserva para borrar.",
        alertaClaveIncorrecta: "Contraseña incorrecta",
        alertaNoAccion: acc => `No se puede ${acc} la reserva.`,
        alertaConfirmarPago: "Después del pago se confirmará tu clase. Recuerda llegar 10 minutos antes del horario seleccionado.",
        alertaPagar: "Pagar",
        alertaCancelar: "Cancelar",
        tituloTicket: "¡A subir tu nivel de tango, te esperamos!",
        comoFunciona: "¿Cómo funciona?",
        alertaInactividadTitulo: "El tango espera",
        alertaInactividadTexto: "También mucha gente reservando, ¡no pierdas tu lugar!",
        alertaInactividadContinuar: "Continuar",
        alertaInactividadCancelar: "Cancelar",
    },
    en: {
        titulo: "Dance Class Reservations",
        clases: "Available Classes",
        reservar: "Book Your Class",
        nombre: "Name:",
        telefono: "Phone:",
        fecha: "Date:",
        horario: "Time:",
        reservarBtn: "Book",
        reservasActuales: "Current Reservations",
        total: "Total reservations:",
        ticket: "Reservation confirmed:",
        pagar: "Pay",
        cancelar: "Cancel",
        modificar: "Edit",
        borrarSeleccionadas: "Delete selected",
        seleccionarTodas: "Select all",
        alertaReservaExitosa: "Your class has been successfully booked!",
        alertaClaseAgendada: "Class booked",
        alertaCancelado: "Tango always awaits you",
        alertaSeleccionaReserva: "Select at least one reservation to delete.",
        alertaClaveIncorrecta: "Incorrect password",
        alertaNoAccion: acc => `Cannot ${acc} the reservation.`,
        alertaConfirmarPago: "After payment your class will be confirmed. Please arrive 10 minutes before your selected time.",
        alertaPagar: "Pay",
        alertaCancelar: "Cancel",
        tituloTicket: "Level up your tango, we are waiting for you!",
        comoFunciona: "How does it work?",
        alertaInactividadTitulo: "Tango awaits",
        alertaInactividadTexto: "Many people are booking, don't lose your spot!",
        alertaInactividadContinuar: "Continue",
        alertaInactividadCancelar: "Cancel",
    }
};

function setLanguage(lang) {
    const t = textos[lang] || textos.es;
    document.title = t.titulo;
    document.querySelector("header h1").textContent = t.titulo;
    document.querySelector(".info h2").textContent = t.clases;
    document.querySelector(".reservation-form h2").textContent = t.reservar;
    document.querySelector("label[for='name']").textContent = t.nombre;
    document.querySelector("label[for='phone']").textContent = t.telefono;
    document.querySelector("label[for='date']").textContent = t.fecha;
    document.querySelector("label[for='time']").textContent = t.horario;
    document.querySelector("#reservationForm button[type='submit']").textContent = t.reservarBtn;
    document.querySelector(".reservations-list h2").textContent = t.reservasActuales;

    // Cambia el texto del botón "Borrar seleccionadas"
    const borrarBtn = document.getElementById("borrarSeleccionadasBtn");
    if (borrarBtn) borrarBtn.textContent = t.borrarSeleccionadas;

    // Cambia el texto del checkbox "Seleccionar todas"
    const selectAll = document.getElementById("selectAllChecks");
    if (selectAll && selectAll.parentElement) {
        const strong = selectAll.parentElement.querySelector("strong");
        if (strong) strong.textContent = t.seleccionarTodas;
    }

    // Cambia el texto de todos los botones "Modificar"
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.textContent = t.modificar;
    });

    // Cambia el texto del botón "¿Cómo funciona?"
    const btnTour = document.getElementById("btnTour");
    if (btnTour) btnTour.textContent = t.comoFunciona || "¿Cómo funciona?";

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = textos[lang][key];
    });
}

// Detecta idioma guardado o del navegador
const savedLang = localStorage.getItem("lang");
let userLang = savedLang || (navigator.language.startsWith("en") ? "en" : "es");
document.getElementById("langSelect").value = userLang;
setLanguage(userLang);

// Cambia idioma al seleccionar en el menú
document.getElementById("langSelect").addEventListener("change", function() {
    userLang = this.value;
    setLanguage(userLang);
    localStorage.setItem("lang", userLang);
    renderReservations(); // Para que los botones se actualicen al instante
});

// --- Inactividad: alerta tras 2 minutos ---
let inactividadTimer;

function resetInactividad() {
    clearTimeout(inactividadTimer);
    const t = textos[userLang];
    inactividadTimer = setTimeout(() => {
        Swal.fire({
            icon: 'warning',
            title: t.alertaInactividadTitulo,
            html: t.alertaInactividadTexto,
            showCancelButton: true,
            confirmButtonText: t.alertaInactividadContinuar,
            cancelButtonText: t.alertaInactividadCancelar
        }).then(result => {
            if (result.isConfirmed) {
                resetInactividad();
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                window.location.reload(); // O puedes limpiar el formulario o cerrar sesión
            }
        });
    }, 2 * 60 * 1000); // 2 minutos
}

// Detecta actividad del usuario
['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(evt =>
    document.addEventListener(evt, resetInactividad)
);

// Inicia el timer al cargar la página
resetInactividad();

// Inicializar
renderReservations();
reservationFormSection.classList.add("visible");
reservationFormSection.classList.remove("oculto");