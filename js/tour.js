// Tour interactivo paso a paso para el simulador de reservas

function mostrarTour() {
    const tours = {
        es: [
            {
                title: "Bienvenido/a",
                html: `Este simulador te permite reservar clases de baile de forma sencilla.<br><br>¡Vamos a ver cómo funciona!`,
                confirmButtonText: "Siguiente"
            },
            {
                title: "Elige tu idioma",
                html: `En la esquina superior derecha puedes elegir entre Español o Inglés.<br><br>Esto cambiará todo el sistema al idioma seleccionado.`,
                confirmButtonText: "Siguiente"
            },
            {
                title: "Selecciona una clase",
                html: `Haz clic en el botón de la clase que deseas reservar: Tango, Vals, Milonga o Tango Escenario.`,
                confirmButtonText: "Siguiente"
            },
            {
                title: "Completa el formulario",
                html: `Ingresa tu nombre, teléfono, selecciona la fecha y el horario disponible.<br><br>Luego haz clic en <b>Reservar</b>.`,
                confirmButtonText: "Siguiente"
            },
            {
                title: "Confirma tu reserva",
                html: `Verás un ticket de confirmación.<br>Puedes pagar o cancelar la reserva desde la ventana emergente.`,
                confirmButtonText: "Siguiente"
            },
            {
                title: "Gestiona tus reservas",
                html: `Tus reservas aparecerán en la lista de <b>Reservas Actuales</b>.<br>Si eres administrador, puedes modificar o borrar reservas.`,
                confirmButtonText: "¡Listo!"
            }
        ],
        en: [
            {
                title: "Welcome",
                html: `This simulator lets you easily book dance classes.<br><br>Let's see how it works!`,
                confirmButtonText: "Next"
            },
            {
                title: "Choose your language",
                html: `In the top right corner you can choose between Spanish or English.<br><br>This will change the whole system language.`,
                confirmButtonText: "Next"
            },
            {
                title: "Select a class",
                html: `Click the button for the class you want to book: Tango, Vals, Milonga or Tango Escenario.`,
                confirmButtonText: "Next"
            },
            {
                title: "Fill out the form",
                html: `Enter your name, phone, select the date and available time.<br><br>Then click <b>Book</b>.`,
                confirmButtonText: "Next"
            },
            {
                title: "Confirm your booking",
                html: `You will see a confirmation ticket.<br>You can pay or cancel the booking from the popup window.`,
                confirmButtonText: "Next"
            },
            {
                title: "Manage your bookings",
                html: `Your bookings will appear in the <b>Current Reservations</b> list.<br>If you are an admin, you can edit or delete bookings.`,
                confirmButtonText: "Done!"
            }
        ]
    };

    // Detecta el idioma actual (usa la misma variable global que tu app)
    const lang = window.userLang || localStorage.getItem("lang") || (navigator.language.startsWith("en") ? "en" : "es");
    const pasos = tours[lang] || tours.es;

    let paso = 0;
    function siguientePaso() {
        if (paso < pasos.length) {
            Swal.fire({
                icon: 'info',
                title: pasos[paso].title,
                html: pasos[paso].html,
                confirmButtonText: pasos[paso].confirmButtonText,
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then(() => {
                paso++;
                siguientePaso();
            });
        }
    }
    siguientePaso();
}

// Tour interactivo con parpadeo de botones según la secuencia

function parpadearElemento(elemento, veces = 6, intervalo = 300) {
    let count = 0;
    const originalBoxShadow = elemento.style.boxShadow;
    const blink = setInterval(() => {
        elemento.style.boxShadow = (count % 2 === 0)
            ? "0 0 10px 4px #ffd700, 0 0 20px 8px #fff70055"
            : originalBoxShadow;
        count++;
        if (count >= veces) {
            clearInterval(blink);
            elemento.style.boxShadow = originalBoxShadow;
        }
    }, intervalo);
}

function mostrarTourSecuencial() {
    const lang = window.userLang || localStorage.getItem("lang") || (navigator.language.startsWith("en") ? "en" : "es");
    const pasos = [
        {
            selector: "#langSelect",
            es: {
                title: "Elige tu idioma",
                html: `Haz clic aquí para seleccionar Español o Inglés.`,
                confirmButtonText: "Siguiente"
            },
            en: {
                title: "Choose your language",
                html: `Click here to select Spanish or English.`,
                confirmButtonText: "Next"
            }
        },
        {
            selector: ".clase-btn",
            es: {
                title: "Selecciona una clase",
                html: `Haz clic en el botón de la clase que deseas reservar.`,
                confirmButtonText: "Siguiente"
            },
            en: {
                title: "Select a class",
                html: `Click the button for the class you want to book.`,
                confirmButtonText: "Next"
            }
        },
        {
            selector: "#reservationForm",
            es: {
                title: "Completa el formulario",
                html: `Ingresa tus datos y haz clic en Reservar.`,
                confirmButtonText: "Siguiente"
            },
            en: {
                title: "Fill out the form",
                html: `Enter your details and click Book.`,
                confirmButtonText: "Next"
            }
        },
        {
            selector: "#btnTour",
            es: {
                title: "¿Necesitas ayuda?",
                html: `Puedes volver a ver esta guía haciendo clic aquí.`,
                confirmButtonText: "¡Listo!"
            },
            en: {
                title: "Need help?",
                html: `You can see this guide again by clicking here.`,
                confirmButtonText: "Done!"
            }
        }
    ];

    let paso = 0;
    function siguientePaso() {
        if (paso < pasos.length) {
            let pasoActual = pasos[paso][lang] || pasos[paso].es;
            let elemento = document.querySelector(pasos[paso].selector);
            if (elemento) parpadearElemento(elemento);
            Swal.fire({
                icon: 'info',
                title: pasoActual.title,
                html: pasoActual.html,
                confirmButtonText: pasoActual.confirmButtonText,
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then(() => {
                if (elemento) elemento.style.boxShadow = "";
                paso++;
                siguientePaso();
            });
        }
    }
    siguientePaso();
}

// Ejecuta el tour automáticamente al cargar la página
document.getElementById("btnTour").addEventListener("click", mostrarTour);
