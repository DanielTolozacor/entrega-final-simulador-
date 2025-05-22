let reservations = JSON.parse(localStorage.getItem("reservas")) || [];

function getReservations() {
    return reservations;
}

function createReservation(name, phone, date, clase, time) {
    // Verifica duplicados
    if (reservations.some(r => r.date === date && r.time === time)) {
        return false;
    }
    reservations.push({ name, phone, date, clase, time });
    localStorage.setItem("reservas", JSON.stringify(reservations)); // Guarda en localStorage
    return true;
}

// Si modificas o borras reservas en otras funciones, recuerda actualizar localStorage también:
function updateReservations() {
    localStorage.setItem("reservas", JSON.stringify(reservations));
}