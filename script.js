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
const taskModal = document.getElementById('taskModal');
const closeModal = document.getElementById('closeModal');
const taskNameSpan = document.getElementById('taskName');
const taskDateSpan = document.getElementById('taskDate');
const taskStartTimeSpan = document.getElementById('taskStartTime');
const taskEndTimeSpan = document.getElementById('taskEndTime');
const taskCategorySpan = document.getElementById('taskCategory');

// Botón para cambiar a "Personalizar Calendario"
const customizeCalendarViewButton = document.getElementById('customizeCalendarView');
const backToDailyTasksButton = document.getElementById('backToDailyTasks');

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

// Función para abrir la ventana emergente con la información de la tarea
function openTaskModal(task) {
    taskNameSpan.textContent = task.name;
    taskDateSpan.textContent = task.date || 'No disponible'; // Por si falta el dato
    taskStartTimeSpan.textContent = `${task.startHour}:${task.startMinute.toString().padStart(2, '0')}`;
    taskEndTimeSpan.textContent = `${task.endHour}:${task.endMinute.toString().padStart(2, '0')}`;
    taskCategorySpan.textContent = task.category || 'Sin categoría';

    // Mostrar la ventana emergente
    taskModal.classList.remove('hidden');
    taskModal.style.display = 'block';
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

    tasksForDate.forEach(task => {
        const startTotalMinutes = task.startHour * 60 + task.startMinute; // Minutos desde las 00:00
        const endTotalMinutes = task.endHour * 60 + task.endMinute;

        console.log(`Procesando tarea: ${task.name}`);
        console.log(`Inicio en minutos totales: ${startTotalMinutes}, Fin: ${endTotalMinutes}`);

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
// Crear la estructura de celdas del timeline
function generateTimelineGrid() {
    const timeline = document.getElementById('timeline'); // Seleccionar el contenedor
    timeline.innerHTML = ''; // Limpiar contenido previo

    // Generar 24 celdas, una para cada hora
    for (let hour = 0; hour < 24; hour++) {
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
    const timelineWidth = timeline.offsetWidth; // Obtener el ancho actualizado del timeline
    const totalMinutesInDay = 24 * 60; // Total de minutos en un día

    // Limpiar todas las barras de tareas antes de recalcular posiciones
    timeline.querySelectorAll('.taskBar').forEach(taskBar => taskBar.remove());

    // Recorrer tareas por fecha
    Object.entries(tasksByDate).forEach(([date, tasksForDate]) => {
        if (Array.isArray(tasksForDate)) {
            tasksForDate.forEach(task => {
                const startTotalMinutes = task.startHour * 60 + task.startMinute;
                const endTotalMinutes = task.endHour * 60 + task.endMinute;

                // Calcular posición inicial y ancho en píxeles
                const taskStartPosition = (startTotalMinutes / totalMinutesInDay) * timelineWidth;
                const taskWidth = ((endTotalMinutes - startTotalMinutes) / totalMinutesInDay) * timelineWidth;

                // Validar ancho y posición
                if (taskWidth > 0 && taskStartPosition >= 0) {
                    // Crear la barra de tarea
                    const taskBar = document.createElement('div');
                    taskBar.classList.add('taskBar', task.category);
                    taskBar.style.position = 'absolute';
                    taskBar.style.left = `${taskStartPosition}px`;
                    taskBar.style.width = `${taskWidth}px`;
                    taskBar.textContent = task.name;

                    // Asociar información de la tarea al elemento (dataset)
                    taskBar.dataset.taskName = task.name;
                    taskBar.dataset.taskDate = date; // Usamos la clave de fecha directamente
                    taskBar.dataset.startHour = task.startHour;
                    taskBar.dataset.startMinute = task.startMinute;
                    taskBar.dataset.endHour = task.endHour;
                    taskBar.dataset.endMinute = task.endMinute;

                    // Añadir un evento click para mostrar información en la consola
                    taskBar.addEventListener('click', () => {
                        openTaskModal(task); // Llama a la función para abrir la ventana emergente
                    });                    

                    timeline.appendChild(taskBar); // Añadir la barra al timeline
                } else {
                    console.warn('Tarea inválida (posición o tamaño incorrectos):', task);
                }
            });
        } else {
            console.error("tasksForDate no es un array:", tasksForDate);
        }
    });

    console.log('Posiciones de tareas recalculadas según el nuevo tamaño del timeline.');
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

    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;

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

    timeline.appendChild(taskBar);

    alert(`Tarea creada para el ${selectedDate} de ${startHour}:${startMinute.toString().padStart(2, '0')} a ${endHour}:${endMinute.toString().padStart(2, '0')}`);
});

// Evento para iniciar tarea
startButton.addEventListener('click', () => {
    // Comprueba si hay una tarea en curso
    if (currentTaskBar) {
        alert("Ya hay una tarea en curso. Por favor, finalízala antes de iniciar otra.");
        return;
    }

    // Encuentra la tarea más cercana en el timeline
    const taskBars = document.querySelectorAll('.taskBar:not(.completed)'); // Tareas no completadas
    if (taskBars.length === 0) {
        alert("No quedan tareas por iniciar.");
        return;
    }

    // Selecciona la tarea con el menor margen izquierdo (más cercana en el tiempo)
    let closestTask = taskBars[0];
    let closestLeft = parseFloat(closestTask.style.left);
    taskBars.forEach(task => {
        const taskLeft = parseFloat(task.style.left);
        if (taskLeft < closestLeft) {
            closestTask = task;
            closestLeft = taskLeft;
        }
    });

    // Marca la tarea seleccionada como actual
    currentTaskBar = closestTask;
    startTime = new Date(); // Hora de inicio
    alert(`La tarea "${currentTaskBar.textContent}" ha sido iniciada.`);
});


// Evento para finalizar tarea
endButton.addEventListener('click', () => {
    if (!currentTaskBar) {
        alert("No hay ninguna tarea en curso para finalizar.");
        return;
    }

    // Calcula la duración real de la tarea
    const endTime = new Date();
    const durationMinutes = Math.round((endTime - startTime) / 60000); // Duración en minutos

    // Ajusta el ancho de la barra de tarea según la duración real
    const timelineWidth = timeline.offsetWidth;
    const hourWidth = timelineWidth / 24;
    const minuteWidth = hourWidth / 60;

    // Cálculo dinámico del tamaño con un ancho mínimo proporcional
    const newWidth = Math.max(durationMinutes * minuteWidth, 2); // El mínimo ahora es 5px, ajustable

    currentTaskBar.style.width = `${newWidth}px`;

    // Marca la tarea como completada
    currentTaskBar.classList.add('completed');
    currentTaskBar.style.backgroundColor = '#17a2b8'; // Indica que está completada
    alert(`Tarea finalizada. Duración real: ${durationMinutes} minutos.`);

    // Libera la referencia de la tarea en curso
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
    const category = document.getElementById('customCategory').value;

    // Validar formato de las horas
    const isValidTime = (time) => /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/.test(time);

    if (!taskName || !taskDate || !isValidTime(startTimeValue) || !isValidTime(endTimeValue)) {
        alert('Por favor, completa todos los campos correctamente.');
        return;
    }

    const [startHour, startMinute] = startTimeValue.split(':').map(Number);
    const [endHour, endMinute] = endTimeValue.split(':').map(Number);

    // Validar que la hora de fin sea posterior a la hora de inicio
    if (endHour < startHour || (endHour === startHour && endMinute <= startMinute)) {
        alert('La hora de finalización debe ser posterior a la de inicio.');
        return;
    }

    const newTask = {
        name: taskName,
        startHour,
        startMinute,
        endHour,
        endMinute,
        category: category.toLowerCase()
    };

    console.log("Nueva tarea creada:", newTask);

    // Inicializar el array para la fecha si no existe
    if (!tasksByDate[taskDate]) {
        console.log(`Inicializando tareas para la fecha: ${taskDate}`);
        tasksByDate[taskDate] = [];
    }
    
    tasksByDate[taskDate].push(newTask);
    console.log(`Tareas actuales para ${taskDate}:`, tasksByDate[taskDate]);

    // Guardar tareas actualizadas en localStorage
    saveTasksToLocalStorage();

    // Actualizar el timeline solo si la tarea pertenece al día seleccionado
    const selectedDate = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${selectedDay.toString().padStart(2, '0')}`;
    if (selectedDate === taskDate) {
        console.log(`Actualizando el timeline para la fecha seleccionada (${selectedDate}) con las tareas:`, tasksByDate[taskDate]);
        updateTimeline(tasksByDate[taskDate]);
    }

    // Lanzar el mensaje de confirmación
    alert(`Tarea "${taskName}" creada para el ${taskDate} de ${startHour}:${startMinute.toString().padStart(2, '0')} a ${endHour}:${endMinute.toString().padStart(2, '0')}`);
});

});