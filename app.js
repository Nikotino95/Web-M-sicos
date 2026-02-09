let timer, segundosRestantes, enPausa = true, indiceTareaActual = 0;
let listaTareas = [];

const displayMinutos = document.getElementById("minutes");
const displaySegundos = document.getElementById("seconds");
const activeTaskLabel = document.getElementById("active-task-name");
const taskList = document.getElementById("taskList");
const totalPlannedLabel = document.getElementById("totalPlanned");
const recomendacionTexto = document.getElementById("recommendation-text");

// RECOMENDACIONES
const actualizarRecomendacion = () => {
    const mins = parseInt(document.getElementById("workTime").value);
    if (mins < 20) recomendacionTexto.textContent = "Cuando hay poco tiempo debes centrarte en pasajes concretos mejor que intentar abarcarlo todo";
    else if (mins < 45) recomendacionTexto.textContent = "Calienta bien e intenta apretar en técnica, lo notarás en todo lo que toques.";
    else recomendacionTexto.textContent = "Concentrate en cada detalle, tienes tiempo";
};

// GESTIÓN DE TAREAS
const reconstruirLista = () => {
    const items = taskList.querySelectorAll(".task-item");
    listaTareas = Array.from(items).map(item => ({
        nombre: item.dataset.nombre,
        tiempo: parseInt(item.dataset.tiempo),
        esSubtask: item.classList.contains("subtask"),
        esDescanso: item.classList.contains("is-rest")
    }));
    totalPlannedLabel.textContent = listaTareas.reduce((acc, t) => acc + t.tiempo, 0);
};

const crearTareaHTML = (nombre, tiempo, esDescanso = false) => {
    const li = document.createElement("li");
    li.className = `task-item ${esDescanso ? 'is-rest' : ''}`;
    li.draggable = true;
    li.dataset.nombre = nombre;
    li.dataset.tiempo = tiempo;

    li.innerHTML = `
        <span><strong>${esDescanso ? '☕ ' : ''}${nombre}</strong> (${tiempo} min)</span>
        <div>
            <button class="btn-indent" title="Anidar">⇶</button>
            <button class="btn-delete">×</button>
        </div>
    `;

    li.querySelector(".btn-delete").onclick = () => { li.remove(); reconstruirLista(); };
    li.querySelector(".btn-indent").onclick = () => { li.classList.toggle("subtask"); reconstruirLista(); };

    li.addEventListener("dragstart", () => li.classList.add("dragging"));
    li.addEventListener("dragend", () => { li.classList.remove("dragging"); reconstruirLista(); });

    return li;
};

// GENERADOR AUTOMÁTICO
document.getElementById("btnGeneratePlan").onclick = () => {
    const total = parseInt(document.getElementById("totalTimeAvailable").value);
    if (!total || total < 10) return alert("Introduce tiempo válido");
    
    taskList.innerHTML = "";
    const fases = [ {n: "Calentamiento", p: 0.2}, {n: "Técnica", p: 0.3}, {n: "Repertorio", p: 0.5} ];

    fases.forEach((f, i) => {
        const m = Math.floor(total * f.p);
        if (m > 0) {
            taskList.appendChild(crearTareaHTML(f.n, m, false));
            // Descanso como bloque principal independiente
            if (total > 30 && i < fases.length - 1) {
                taskList.appendChild(crearTareaHTML("Descanso", 5, true));
            }
        }
    });
    reconstruirLista();
    cargarTarea();
};

// CONTROL RELOJ
const cargarTarea = () => {
    if (listaTareas[indiceTareaActual]) {
        const t = listaTareas[indiceTareaActual];
        activeTaskLabel.textContent = (t.esSubtask ? "↳ " : "") + t.nombre;
        activeTaskLabel.style.color = t.esDescanso ? "var(--relax)" : "var(--accent)";
        segundosRestantes = t.tiempo * 60;
        actualizarPantalla(segundosRestantes);
    }
};

const actualizarPantalla = (s) => {
    displayMinutos.textContent = Math.floor(s / 60).toString().padStart(2, '0');
    displaySegundos.textContent = (s % 60).toString().padStart(2, '0');
};

const finalizarFase = () => {
    clearInterval(timer);
    document.getElementById("audioNotificacion").play().catch(() => {});
    indiceTareaActual++;
    if (indiceTareaActual < listaTareas.length) {
        cargarTarea();
        iniciarCronometro();
    } else {
        activeTaskLabel.textContent = "¡Sesión Finalizada!";
        enPausa = true;
    }
};

const iniciarCronometro = () => {
    if (listaTareas.length === 0) return alert("Crea un plan primero");
    if (!segundosRestantes) cargarTarea();
    enPausa = false;
    timer = setInterval(() => {
        segundosRestantes--;
        actualizarPantalla(segundosRestantes);
        if (segundosRestantes <= 0) finalizarFase();
    }, 1000);
};

// EVENTOS
document.getElementById("btnStart").onclick = iniciarCronometro;
document.getElementById("btnPause").onclick = () => { clearInterval(timer); enPausa = true; };
document.getElementById("btnReset").onclick = () => location.reload();
document.getElementById("btnAdd").onclick = () => {
    const n = document.getElementById("taskInput").value, t = parseInt(document.getElementById("taskTimeInput").value);
    if (n && t) { taskList.appendChild(crearTareaHTML(n, t)); reconstruirLista(); }
};

taskList.addEventListener("dragover", e => {
    e.preventDefault();
    const draggingItem = document.querySelector(".dragging");
    const siblings = [...taskList.querySelectorAll(".task-item:not(.dragging)")];
    const nextSibling = siblings.find(sib => e.clientY <= sib.offsetTop + sib.offsetHeight / 2);
    taskList.insertBefore(draggingItem, nextSibling);
});

document.getElementById("workTime").oninput = actualizarRecomendacion;
actualizarRecomendacion();