// Seleccionar elementos principales
const createButton = document.getElementById('createTask');
const startButton = document.getElementById('startTask');
const endButton = document.getElementById('endTask');
const categorySelect = document.getElementById('category');
const calendarBar = document.getElementById('calendarBar');
const selectedDateDisplay = document.getElementById('selectedDate');
const timeline = document.getElementById('timeline');
const timeLabels = document.getElementById('timeLabels');
// Referencias a elementos de la ventana emergente
// Declarar las variables fuera del DOMContentLoaded para que sean accesibles globalmente
let taskModal, closeModal, taskNameSpan, taskDateSpan, taskStartTimeSpan, taskEndTimeSpan, taskCategorySpan;

document.addEventListener('DOMContentLoaded', () => {
    taskModal = document.getElementById('taskModal');
    closeModal = document.getElementById('closeModal');
    taskNameSpan = document.getElementById('taskName');
    taskDateSpan = document.getElementById('taskDate');
    taskStartTimeSpan = document.getElementById('taskStartTime');
    taskEndTimeSpan = document.getElementById('taskEndTime');
    taskCategorySpan = document.getElementById('taskCategory');

    if (closeModal) {
        closeModal.addEventListener('click', () => {
            if (taskModal) {
                taskModal.style.display = 'none'; // Oculta el modal
            }
        });
    }    
});

// Botón para cambiar a "Personalizar Calendario"
const customizeCalendarViewButton = document.getElementById('customizeCalendarView');
const backToDailyTasksButton = document.getElementById('backToDailyTasks');

// Referencias a los botones
const exportTasksButton = document.getElementById('exportTasks');
const importTasksButton = document.getElementById('importTasks');
const importFileInput = document.getElementById('importFileInput');


// Función para exportar tareas a un archivo JSON
exportTasksButton.addEventListener('click', () => {
    const dataStr = JSON.stringify(tasksByDate, null, 2); // Convierte las tareas a JSON
    const blob = new Blob([dataStr], { type: 'application/json' }); // Crea un archivo JSON
    const url = URL.createObjectURL(blob);

    // Crear un enlace para descargar el archivo
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tasks_backup.json';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click(); // Descarga el archivo
    document.body.removeChild(a);

    alert('Las tareas se han exportado correctamente.');
});

// Función para importar tareas desde un archivo JSON
importTasksButton.addEventListener('click', () => {
    importFileInput.click(); // Abre el selector de archivos
});

importFileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const importedTasks = JSON.parse(e.target.result); // Lee el contenido del archivo

            // Validar que sea un objeto con el formato esperado
            if (typeof importedTasks !== 'object' || Array.isArray(importedTasks)) {
                alert('El archivo no tiene un formato válido.');
                return;
            }

            // Actualizar las tareas actuales
            tasksByDate = { ...tasksByDate, ...importedTasks }; // Mezclar tareas actuales con las importadas
            saveTasksToLocalStorage(); // Guardar en localStorage

            // Actualizar el timeline con las tareas importadas
            const selectedDate = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${selectedDay.toString().padStart(2, '0')}`;
            const tasksForDate = tasksByDate[selectedDate] || [];
            updateTimeline(tasksForDate);

            alert('Las tareas se han importado correctamente.');
        } catch (error) {
            alert('Error al importar las tareas. Asegúrate de que el archivo sea un JSON válido.');
        }
    };

    reader.readAsText(file); // Leer el archivo como texto
});

function saveTasksToLocalStorage() {
    // Verificar que todos los valores en tasksByDate sean arrays
    for (const date in tasksByDate) {
        if (!Array.isArray(tasksByDate[date]) || tasksByDate[date].length === 0) {
            console.warn(`Eliminando la fecha ${date} de tasksByDate porque no contiene tareas válidas.`);
            delete tasksByDate[date];
        }
    }    
    localStorage.setItem('tasks', JSON.stringify(tasksByDate));
    console.log("Tareas guardadas en localStorage:", tasksByDate);
}

function loadTasksFromLocalStorage() {
    const storedTasks = localStorage.getItem('tasks');
    if (storedTasks) {
        tasksByDate = JSON.parse(storedTasks); // Actualiza correctamente el objeto tasksByDate
        console.log("Tareas cargadas desde localStorage (antes de validación):", tasksByDate);

        // Validar que todos los valores en tasksByDate sean arrays
        for (const date in tasksByDate) {
            if (!Array.isArray(tasksByDate[date]) || tasksByDate[date].length === 0) {
                console.warn(`Eliminando la fecha ${date} de tasksByDate porque no contiene tareas válidas.`);
                delete tasksByDate[date];
            }
        }        
        console.log("Tareas cargadas desde localStorage (después de validación):", tasksByDate);
    } else {
        tasksByDate = {}; // Inicializa si no hay datos previos
        console.log("No se encontraron tareas en localStorage. Inicializando.");
    }
}

function openTaskModal(task) {
    if (taskNameSpan) {
        taskNameSpan.textContent = task.name || 'Sin nombre';
    }

    if (taskDateSpan) {
        if (task.date) {
            const [year, month, day] = task.date.split('-');
            taskDateSpan.textContent = `${day}/${month}/${year.slice(-2)}`; // Formato DD/MM/AA
        } else {
            taskDateSpan.textContent = 'No disponible';
        }
    }

    if (taskStartTimeSpan) {
        taskStartTimeSpan.textContent = `${task.startHour}:${task.startMinute.toString().padStart(2, '0')}`;
    }

    if (taskEndTimeSpan) {
        taskEndTimeSpan.textContent = `${task.endHour}:${task.endMinute.toString().padStart(2, '0')}`;
    }

    if (taskCategorySpan) {
        taskCategorySpan.textContent = task.category || 'Sin categoría';
    }

    const taskCommentSpan = document.getElementById('taskComment');
    if (taskCommentSpan) {
        taskCommentSpan.textContent = task.comment || 'Sin comentarios';
    }

    // Crear y añadir botón para borrar la tarea
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Borrar Tarea';
    deleteButton.style.backgroundColor = '#ff4d4d';
    deleteButton.style.color = '#fff';
    deleteButton.style.border = 'none';
    deleteButton.style.padding = '10px 20px';
    deleteButton.style.borderRadius = '5px';
    deleteButton.style.cursor = 'pointer';
    deleteButton.style.marginTop = '10px';

    deleteButton.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que deseas borrar esta tarea?')) {
            // Eliminar la tarea del array correspondiente
            const selectedDate = task.date;
            tasksByDate[selectedDate] = tasksByDate[selectedDate].filter((t) => t !== task);

            // Guardar los cambios en localStorage
            saveTasksToLocalStorage();

            // Actualizar el timeline
            updateTimeline(tasksByDate[selectedDate] || []);

            // Cerrar el modal
            taskModal.style.display = 'none';
            alert('Tarea borrada correctamente.');
        }
    });

    // Limpiar botones previos para evitar duplicados
    const modalContent = taskModal.querySelector('.modal-content');
    const existingDeleteButton = modalContent.querySelector('button');
    if (existingDeleteButton) {
        existingDeleteButton.remove();
    }

    modalContent.appendChild(deleteButton);

    if (taskModal) {
        taskModal.style.display = 'block';
    }
}

function updateTimeline(tasksForDate) {
    console.log('Tareas recibidas para actualizar el timeline:', tasksForDate);

    // Asegurarnos de que el contenedor del timeline está renderizado y visible
    const timelineWidth = timeline.offsetWidth; // Ancho total del timeline en píxeles
    if (timelineWidth === 0) {
        console.warn('El ancho del timeline es 0. Cancelando renderizado. Asegúrate de que el contenedor #timeline esté visible.');
        return; // Cancela el renderizado sin reintentos
    }

    timeline.innerHTML = ''; // Limpia el timeline actual
    generateTimelineGrid(); // Vuelve a generar la estructura del timeline

    const totalMinutesInDay = 24 * 60; // Total de minutos en un día

    // Función para ajustar la hora al nuevo rango horario (06:00 a 05:00)
    const adjustHourToTimeline = (hour) => (hour - 6 + 24) % 24;

    tasksForDate.forEach(task => {
        // Ajustar las horas de inicio y fin
        const startAdjustedHour = adjustHourToTimeline(task.startHour);
        const endAdjustedHour = adjustHourToTimeline(task.endHour);

        const startTotalMinutes = startAdjustedHour * 60 + task.startMinute;
        const endTotalMinutes = endAdjustedHour * 60 + task.endMinute;

        console.log(`Procesando tarea: ${task.name}`);
        console.log(`Inicio en minutos ajustados: ${startTotalMinutes}, Fin ajustado: ${endTotalMinutes}`);

        // Validación básica
        if (endTotalMinutes <= startTotalMinutes) {
            console.error('La hora de finalización es menor o igual a la hora de inicio:', task);
            return;
        }

        // Calcular posición inicial y ancho en píxeles
        const taskStartPosition = (startTotalMinutes / totalMinutesInDay) * timelineWidth;
        const taskWidth = ((endTotalMinutes - startTotalMinutes) / totalMinutesInDay) * timelineWidth;

        console.log(`Posición inicial en píxeles: ${taskStartPosition}, Ancho: ${taskWidth}`);

        if (taskStartPosition < 0 || taskWidth <= 0) {
            console.error('Error en el cálculo de la posición o ancho de la barra:', {
                task,
                taskStartPosition,
                taskWidth,
                timelineWidth,
                totalMinutesInDay,
            });
            return;
        }

        // Crear la barra de tarea
        const taskBar = document.createElement('div');
        taskBar.classList.add('taskBar', task.category);
        taskBar.style.position = 'absolute';
        taskBar.style.left = `${taskStartPosition}px`;
        taskBar.style.width = `${taskWidth}px`;
        taskBar.textContent = task.name;

        // Asociar información de la tarea al elemento (dataset)
        taskBar.dataset.taskName = task.name;
        taskBar.dataset.taskDate = typeof task.date === 'string' ? task.date : selectedDate;
        taskBar.dataset.startHour = task.startHour;
        taskBar.dataset.startMinute = task.startMinute;
        taskBar.dataset.endHour = task.endHour;
        taskBar.dataset.endMinute = task.endMinute;

        // Añadir un evento click para mostrar información en la consola
        taskBar.addEventListener('click', () => {
            openTaskModal(task); // Llama a la función para abrir la ventana emergente
        });

        timeline.appendChild(taskBar);
    });
}

// Función para formatear automáticamente el campo de hora
function formatTimeInput(event) {
    const input = event.target;
    let value = input.value.replace(/\D/g, ''); // Eliminar caracteres no numéricos

    if (value.length > 4) value = value.slice(0, 4); // Limitar a 4 caracteres

    // Formatear en HH:MM
    if (value.length >= 3) {
        input.value = value.slice(0, 2) + ':' + value.slice(2);
    } else {
        input.value = value;
    }
}

// Añadir el evento a los campos de hora
document.getElementById('startTime').addEventListener('input', formatTimeInput);
document.getElementById('endTime').addEventListener('input', formatTimeInput);

// Añadir evento a las casillas de horas en "Personalizar Calendario"
document.getElementById('customStartTime').addEventListener('input', formatTimeInput);
document.getElementById('customEndTime').addEventListener('input', formatTimeInput);

document.getElementById('dailyTasksView').addEventListener('click', () => {
    document.getElementById('customizeCalendarContent').style.display = 'none'; // Ocultar Personalizar Calendario
    document.getElementById('dailyTasksContent').style.display = 'block'; // Mostrar Tareas Diarias

    // Actualizar el timeline con las tareas de la fecha seleccionada
    updateSelectedDate();
});

const customizeCalendarContent = document.getElementById('customizeCalendarContent');

// Alternar a "Personalizar Calendario"
customizeCalendarViewButton.addEventListener('click', () => {
    dailyTasksContent.style.display = 'none';
    customizeCalendarContent.style.display = 'block';

    // Verificar que el timeline esté visible antes de actualizar
    ensureTimelineReady(() => {
        const selectedDate = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${selectedDay.toString().padStart(2, '0')}`;
updateTimeline(tasksByDate[selectedDate] || []);
    });
});

// Función para asegurar que el timeline esté listo
function ensureTimelineReady(callback, retries = 10) {
    const timelineWidth = timeline.offsetWidth;

    if (timeline.offsetParent === null) {
        console.warn("El timeline no está visible. Cancelando renderizado.");
        return;
    }
    
    if (timelineWidth > 0) {
        console.log("El ancho del timeline es válido:", timelineWidth);
        callback();
    } else if (retries > 0) {
        console.warn(`El ancho del timeline es 0. Reintentos restantes: ${retries}`);
        setTimeout(() => ensureTimelineReady(callback, retries - 1), 100);
    } else {
        console.warn("No se pudo calcular el ancho del timeline. Continuando sin renderizar.");
    }
    
}

// Volver a "Tareas Diarias"
backToDailyTasksButton.addEventListener('click', () => {
    dailyTasksContent.style.display = 'block';
    customizeCalendarContent.style.display = 'none';

    // Actualizar la fecha seleccionada y el timeline
    updateSelectedDate();
});

// Fecha actual
const today = new Date();
let selectedDay = today.getDate();
let currentMonth = today.getMonth();
let currentYear = today.getFullYear();

// Variables globales
let startTime = null; // Hora de inicio de la tarea
let currentTaskBar = null; // Referencia a la barra actual
let tasksByDate = {}; // Objeto para almacenar tareas por fecha

// Crear la estructura de celdas del timeline
function generateTimelineGrid() {
    const timeline = document.getElementById('timeline'); // Seleccionar el contenedor
    timeline.innerHTML = ''; // Limpiar contenido previo

    // Generar las celdas, comenzando desde las 06:00 hasta las 05:00
    for (let i = 0; i < 24; i++) {
        const hour = (i + 6) % 24; // Ajustar el horario para que comience en 06:00
        const hourCell = document.createElement('div');
        hourCell.classList.add('hourCell'); // Clase para estilo
        hourCell.dataset.hour = hour; // Guardar hora en atributo data

        // Agregar la hora como texto dentro de la celda
        const hourLabel = document.createElement('span');
        hourLabel.textContent = `${hour < 10 ? '0' + hour : hour}:00`;
        hourCell.appendChild(hourLabel);

        // Agregar la línea de marca horaria
        const hourMark = document.createElement('div');
        hourMark.classList.add('hourMark'); // Clase para la línea
        hourCell.appendChild(hourMark);

        timeline.appendChild(hourCell); // Añadir la celda al contenedor
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const timeline = document.getElementById('timeline');
    if (!timeline) {
        console.error("El contenedor #timeline no existe en el HTML.");
    } else {
        console.log("El contenedor #timeline ha sido encontrado.");
        generateTimelineGrid();
    }

    // Cargar tareas desde localStorage
    loadTasksFromLocalStorage();

    // Renderizar tareas en el timeline para la fecha seleccionada
    updateSelectedDate();
});

// Generar días del mes
function generateCalendar() {
    calendarBar.innerHTML = '';
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.textContent = day;
        dayElement.classList.add('calendarDay');
        if (day === selectedDay) {
            dayElement.classList.add('selectedDay');
        }

        dayElement.addEventListener('click', () => {
            selectedDay = day;
            updateSelectedDate();
            generateCalendar();
        });

        calendarBar.appendChild(dayElement);
    }
}

// Actualizar la fecha seleccionada
function updateSelectedDate() {
    const date = new Date(currentYear, currentMonth, selectedDay);
    selectedDateDisplay.textContent = `Fecha seleccionada: ${date.toLocaleDateString()}`;
    timeline.innerHTML = ''; // Limpia el timeline

    // Obtener las tareas de la fecha seleccionada
    const selectedDate = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${selectedDay.toString().padStart(2, '0')}`;
    const tasksForDate = Array.isArray(tasksByDate[selectedDate]) ? tasksByDate[selectedDate] : [];
    // Dibujar las tareas en el timeline
    updateTimeline(tasksForDate);
}

// Inicializar el calendario
generateCalendar();
updateSelectedDate();

// Generar etiquetas de tiempo
function generateTimeLabels() {
    // Esta función ya no hace nada porque eliminamos las etiquetas horarias
}

// Recalcular las posiciones y tamaños de las barras
function recalculateTaskPositions() {
    const timelineWidth = timeline.offsetWidth; // Ancho actual del timeline
    const totalMinutesInDay = 24 * 60; // Total de minutos en un día

    // Función para ajustar las horas al rango del timeline (06:00 a 05:00)
    const adjustHourToTimeline = (hour) => (hour - 6 + 24) % 24;

    // Limpiar todas las barras de tareas antes de recalcular
    timeline.querySelectorAll('.taskBar').forEach(taskBar => taskBar.remove());

    // Recorrer tareas por fecha
    Object.entries(tasksByDate).forEach(([date, tasksForDate]) => {
        if (Array.isArray(tasksForDate)) {
            tasksForDate.forEach(task => {
                const startAdjustedHour = adjustHourToTimeline(task.startHour);
                const endAdjustedHour = adjustHourToTimeline(task.endHour);

                const startTotalMinutes = startAdjustedHour * 60 + task.startMinute;
                const endTotalMinutes = endAdjustedHour * 60 + task.endMinute;

                const taskStartPosition = (startTotalMinutes / totalMinutesInDay) * timelineWidth;
                const taskWidth = ((endTotalMinutes - startTotalMinutes) / totalMinutesInDay) * timelineWidth;

                if (taskWidth > 0 && taskStartPosition >= 0) {
                    const taskBar = document.createElement('div');
                    taskBar.classList.add('taskBar', task.category);
                    taskBar.style.position = 'absolute';
                    taskBar.style.left = `${taskStartPosition}px`;
                    taskBar.style.width = `${taskWidth}px`;
                    taskBar.textContent = task.name;

                    // Marcar estado de la tarea (inProgress o completed)
                    if (task.status === 'inProgress') {
                        taskBar.style.backgroundColor = '#10F9FF'; // Color para tareas en curso
                    } else if (task.status === 'completed') {
                        taskBar.style.backgroundColor = '#17a2b8'; // Color para tareas completadas
                    }

                    taskBar.dataset.taskName = task.name;
                    taskBar.dataset.taskDate = date;
                    taskBar.dataset.startHour = task.startHour;
                    taskBar.dataset.startMinute = task.startMinute;
                    taskBar.dataset.endHour = task.endHour;
                    taskBar.dataset.endMinute = task.endMinute;

                    taskBar.addEventListener('click', () => openTaskModal(task));

                    timeline.appendChild(taskBar);
                }
            });
        }
    });

    // Forzar el redibujado del timeline
    timeline.style.display = 'none';
    timeline.offsetHeight; // Trigger reflow
    timeline.style.display = 'grid';

    console.log('Posiciones de tareas recalculadas.');
}

// Ajustar etiquetas de tiempo al cargar y redimensionar
document.addEventListener('DOMContentLoaded', () => {
    generateTimelineGrid(); // Cargar solo las celdas del timeline
    recalculateTaskPositions();
});

window.addEventListener('resize', () => {
    generateTimeLabels();
    recalculateTaskPositions();
});

// Evento para crear tarea
createButton.addEventListener('click', () => {
    const startTimeValue = document.getElementById('startTime').value.trim();
    const endTimeValue = document.getElementById('endTime').value.trim();

    // Validar formato de las horas
    const isValidTime = (time) => /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/.test(time);

    if (!isValidTime(startTimeValue)) {
        alert('La hora de inicio no tiene un formato válido. Usa HH:MM.');
        return;
    }
    if (!isValidTime(endTimeValue)) {
        alert('La hora de finalización no tiene un formato válido. Usa HH:MM.');
        return;
    }

    // Extraer horas y minutos
    const [startHour, startMinute] = startTimeValue.split(':').map(Number);
    const [endHour, endMinute] = endTimeValue.split(':').map(Number);

    // Validar que la hora de fin sea posterior a la hora de inicio
    if (endHour < startHour || (endHour === startHour && endMinute <= startMinute)) {
        alert('La hora de finalización debe ser posterior a la de inicio.');
        return;
    }

    // Crear el objeto de la nueva tarea
    const newTask = {
        name: categorySelect.value, // Puedes añadir más campos si lo deseas
        startHour,
        startMinute,
        endHour,
        endMinute,
        category: categorySelect.value.toLowerCase()
    };

    // Obtener la fecha seleccionada
    const selectedDate = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${selectedDay.toString().padStart(2, '0')}`;

    // Asegurarnos de que existe un array para esta fecha en `tasksByDate`
    if (!tasksByDate[selectedDate]) {
        tasksByDate[selectedDate] = [];
    }

    // Agregar la tarea al array de la fecha correspondiente
    tasksByDate[selectedDate].push(newTask);

    // Guardar las tareas en localStorage
    localStorage.setItem('tasks', JSON.stringify(tasksByDate));

    // Dibujar la tarea en el timeline actual
    const totalMinutesInDay = 24 * 60;
    const timelineWidth = timeline.offsetWidth;

    // Función para ajustar la hora al nuevo rango horario (06:00 a 05:00)
    const adjustHourToTimeline = (hour) => (hour - 6 + 24) % 24;

    // Ajustar las horas de inicio y fin
    const startAdjustedHour = adjustHourToTimeline(startHour);
    const endAdjustedHour = adjustHourToTimeline(endHour);

    const startTotalMinutes = startAdjustedHour * 60 + startMinute;
    const endTotalMinutes = endAdjustedHour * 60 + endMinute;

    const taskStartPosition = (startTotalMinutes / totalMinutesInDay) * timelineWidth; // Posición inicial en píxeles
    const taskWidth = ((endTotalMinutes - startTotalMinutes) / totalMinutesInDay) * timelineWidth; // Ancho en píxeles

    // Crear la barra de tarea
    const taskBar = document.createElement('div');
    taskBar.classList.add('taskBar');
    taskBar.classList.add(categorySelect.value.toLowerCase()); // Clase dinámica según la categoría
    taskBar.style.position = 'absolute';
    taskBar.style.left = `${taskStartPosition}px`;
    taskBar.style.width = `${taskWidth}px`;
    taskBar.style.top = `0px`;
    taskBar.textContent = `${categorySelect.value}`;

// Añadir evento para abrir el modal al hacer clic
taskBar.addEventListener('click', () => {
    openTaskModal({
        name: categorySelect.value,
        startHour,
        startMinute,
        endHour,
        endMinute,
        category: categorySelect.value.toLowerCase(),
    });
});

timeline.appendChild(taskBar);


    timeline.appendChild(taskBar);

    // Mostrar alerta de creación de tarea solo en móviles
if (window.innerWidth <= 768) { // Solo para pantallas pequeñas
    const existingAlerts = document.querySelectorAll('.task-created-alert');
    existingAlerts.forEach(alert => alert.remove()); // Elimina alertas duplicadas

    const alertDiv = document.createElement('div');
    alertDiv.className = 'task-created-alert';
    alertDiv.textContent = `Tarea creada para el ${selectedDate} de ${startHour}:${startMinute.toString().padStart(2, '0')} a ${endHour}:${endMinute.toString().padStart(2, '0')}`;
    alertDiv.style.position = 'fixed';
    alertDiv.style.bottom = '20px';
    alertDiv.style.left = '50%';
    alertDiv.style.transform = 'translateX(-50%)';
    alertDiv.style.padding = '10px 20px';
    alertDiv.style.backgroundColor = '#036105';
    alertDiv.style.color = '#fff';
    alertDiv.style.borderRadius = '5px';
    alertDiv.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.3)';
    alertDiv.style.zIndex = '1000';

    document.body.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.remove();
    }, 3000); // La alerta desaparecerá después de 3 segundos
} else {
    // Para pantallas grandes, usa alert normal
    alert(`Tarea creada para el ${selectedDate} de ${startHour}:${startMinute.toString().padStart(2, '0')} a ${endHour}:${endMinute.toString().padStart(2, '0')}`);
}

});

// Evento para iniciar tarea
startButton.addEventListener('click', () => {
    if (currentTaskBar) {
        alert("Ya hay una tarea en curso. Por favor, finalízala antes de iniciar otra.");
        return;
    }

    const taskBars = document.querySelectorAll('.taskBar:not(.completed)');
    if (taskBars.length === 0) {
        alert("No quedan tareas por iniciar.");
        return;
    }

    let closestTask = taskBars[0];
    let closestLeft = parseFloat(closestTask.style.left) || 0;

    taskBars.forEach(task => {
        const taskLeft = parseFloat(task.style.left) || 0;
        if (taskLeft < closestLeft) {
            closestTask = task;
            closestLeft = taskLeft;
        }
    });

    // Ajustar color para tarea iniciada
    closestTask.style.backgroundColor = '#10F9FF';
    closestTask.dataset.status = 'inProgress';

    currentTaskBar = closestTask;
    startTime = new Date();

    alert(`La tarea "${currentTaskBar.textContent}" ha sido iniciada.`);
}, { passive: false }); // Asegurar que los eventos táctiles no interfieran


endButton.addEventListener('click', () => {
    if (!currentTaskBar) {
        alert("No hay ninguna tarea en curso para finalizar.");
        return;
    }

    const endTime = new Date();
    const durationMinutes = Math.round((endTime - startTime) / 60000);

    const timelineWidth = timeline.offsetWidth;
    const totalMinutesInDay = 24 * 60;

    const newWidth = Math.max((durationMinutes / totalMinutesInDay) * timelineWidth, 5);

    currentTaskBar.style.width = `${newWidth}px`;
    currentTaskBar.classList.add('completed');
    currentTaskBar.style.backgroundColor = '#17a2b8'; // Color para tarea completada

    // Actualizar el estado de la tarea en tasksByDate
    const taskDate = currentTaskBar.dataset.taskDate;
    const taskName = currentTaskBar.dataset.taskName;
    tasksByDate[taskDate] = tasksByDate[taskDate].map(task =>
        task.name === taskName ? { ...task, status: 'completed' } : task
    );

    saveTasksToLocalStorage();

    // Recalcular las posiciones de las tareas para asegurar consistencia
    recalculateTaskPositions();

    alert(`Tarea finalizada. Duración: ${durationMinutes} minutos.`);

    currentTaskBar = null;
    startTime = null;
});

// Evento para borrar todas las tareas
const clearTasksButton = document.getElementById('clearTasks');
clearTasksButton.addEventListener('click', () => {
    if (confirm('¿Deseas borrar todas las tareas del día seleccionado?')) {
        const selectedDate = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${selectedDay.toString().padStart(2, '0')}`;

        console.log(`Estado inicial de tasksByDate:`, JSON.stringify(tasksByDate, null, 2));
        console.log(`Estado inicial de localStorage:`, localStorage.getItem('tasks'));

        // Verificar si existe la fecha en tasksByDate
        if (tasksByDate[selectedDate]) {
            delete tasksByDate[selectedDate]; // Elimina la clave de la fecha seleccionada
            console.log(`Clave "${selectedDate}" eliminada de tasksByDate.`);
        } else {
            console.warn(`La fecha seleccionada (${selectedDate}) no existe en tasksByDate.`);
        }

        console.log(`Estado de tasksByDate después de eliminar:`, JSON.stringify(tasksByDate, null, 2));

        // Actualizar localStorage
        saveTasksToLocalStorage();

        console.log(`Estado final de localStorage:`, localStorage.getItem('tasks'));

        // Eliminar tareas del timeline
        const taskBars = timeline.querySelectorAll('.taskBar');
        taskBars.forEach(taskBar => taskBar.remove());

        alert('Tareas del día seleccionadas eliminadas definitivamente.');
    }
});

// Control del menú lateral
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('show');

    const createCustomTaskButton = document.getElementById('createCustomTask');

// Evento para crear una tarea personalizada
createCustomTaskButton.addEventListener('click', () => {
    const taskName = document.getElementById('customTaskName').value.trim();
    const taskDate = document.getElementById('customDate').value.trim();
    const startTimeValue = document.getElementById('customStartTime').value.trim();
    const endTimeValue = document.getElementById('customEndTime').value.trim();
    const category = document.getElementById('customCategory').value.trim().toLowerCase();

    // Validar datos básicos
    if (!taskName || !taskDate || !startTimeValue || !endTimeValue) {
        alert('Por favor, completa todos los campos correctamente.');
        return;
    }

    // Validar formato de las horas
    const isValidTime = (time) => /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/.test(time);
    if (!isValidTime(startTimeValue) || !isValidTime(endTimeValue)) {
        alert('Formato de hora inválido. Usa HH:MM.');
        return;
    }

    const [startHour, startMinute] = startTimeValue.split(':').map(Number);
    const [endHour, endMinute] = endTimeValue.split(':').map(Number);

    if (endHour < startHour || (endHour === startHour && endMinute <= startMinute)) {
        alert('La hora de finalización debe ser posterior a la de inicio.');
        return;
    }

    // Crear la nueva tarea
    const newTask = {
        name: taskName,
        startHour,
        startMinute,
        endHour,
        endMinute,
        category: category.toLowerCase(),
        comment: document.getElementById('customTaskComment').value.trim(),
        date: taskDate
    };

    // Asegurar que exista la fecha en `tasksByDate`
    if (!tasksByDate[taskDate]) {
        tasksByDate[taskDate] = [];
    }

    tasksByDate[taskDate].push(newTask);
    saveTasksToLocalStorage();

    // Mostrar una sola notificación por tarea creada
    const existingAlert = document.querySelector('.task-created-alert');
    if (!existingAlert) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'task-created-alert';
        alertDiv.textContent = `Tarea "${taskName}" creada para el ${taskDate}`;
        alertDiv.style.position = 'fixed';
        alertDiv.style.bottom = '20px';
        alertDiv.style.left = '50%';
        alertDiv.style.transform = 'translateX(-50%)';
        alertDiv.style.padding = '10px 20px';
        alertDiv.style.backgroundColor = '#036105';
        alertDiv.style.color = '#fff';
        alertDiv.style.borderRadius = '5px';
        alertDiv.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.3)';
        alertDiv.style.zIndex = '1000';

        document.body.appendChild(alertDiv);

        setTimeout(() => {
            alertDiv.remove();
        }, 3000); // La alerta desaparecerá después de 3 segundos
    }
});

// Prevenir el desplazamiento vertical de la página cuando se interactúa con el calendario
calendarBar.addEventListener('touchstart', (event) => {
    if (event.targetTouches.length === 1) {
        // Solo ejecuta si hay un dedo en pantalla
        calendarBar.dataset.scrollStartX = event.targetTouches[0].clientX;
        calendarBar.dataset.scrollStartLeft = calendarBar.scrollLeft;
    }
});

calendarBar.addEventListener('touchmove', (event) => {
    if (event.targetTouches.length === 1) {
        // Calcula la diferencia horizontal
        const deltaX = event.targetTouches[0].clientX - calendarBar.dataset.scrollStartX;
        calendarBar.scrollLeft = calendarBar.dataset.scrollStartLeft - deltaX;

        // Prevenir el scroll vertical de la página
        event.preventDefault();
    }
});

});
