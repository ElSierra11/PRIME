/**
 * PRIME OS - Main Application Logic
 * Integrates: Schedule & Conflict Detection, Free Slot Finder, Outlier Stopwatch,
 * Express Workout Guide, and Smart Savings Filter.
 */

// ==========================================
// 1. DATA INITIALIZATION & LOCALSTORAGE
// ==========================================

const DEFAULT_SCHEDULE = [
  // Lunes (0)
  { id: 'ev-1', day: 0, title: 'Levantarme & Llevar a mis hermanas', category: 'family', start: '06:30', end: '07:15', notes: 'Rutina familiar mañanera' },
  { id: 'ev-2', day: 0, title: 'Clase U: Gestión y Calidad del Software', category: 'university', start: '09:00', end: '12:00', notes: 'Materia obligatoria U' },
  { id: 'ev-3', day: 0, title: 'Trabajo de Grado U (Tesis)', category: 'thesis', start: '10:00', end: '12:30', notes: 'Avance con asesor (Posible cruce con clase)' },
  { id: 'ev-4', day: 0, title: 'Recoger a Avril', category: 'family', start: '12:45', end: '13:30', notes: 'Colegio' },
  { id: 'ev-5', day: 0, title: 'GYM Sesión Prime (Pecho/Tríceps)', category: 'gym', start: '15:30', end: '16:45', notes: '65 min intensos' },
  { id: 'ev-6', day: 0, title: 'Turno Outlier (Deep Work)', category: 'outlier', start: '18:00', end: '21:30', notes: '3.5 horas de tareas' },

  // Martes (1)
  { id: 'ev-7', day: 1, title: 'Levantarme & Llevar a mis hermanas', category: 'family', start: '06:30', end: '07:15', notes: 'Salida colegio' },
  { id: 'ev-8', day: 1, title: 'Terapias Abuela', category: 'family', start: '07:30', end: '08:15', notes: 'Acompañamiento' },
  { id: 'ev-9', day: 1, title: 'Trabajo de Grado U (Tesis)', category: 'thesis', start: '08:30', end: '12:30', notes: 'Bloque de 4 horas enfocado' },
  { id: 'ev-10', day: 1, title: 'Recoger a Avril', category: 'family', start: '12:45', end: '13:30', notes: 'Colegio' },
  { id: 'ev-11', day: 1, title: 'GYM Sesión Prime (Espalda/Bíceps)', category: 'gym', start: '15:30', end: '16:45', notes: '70 min' },
  { id: 'ev-12', day: 1, title: 'Turno Outlier (Deep Work)', category: 'outlier', start: '18:00', end: '21:30', notes: '3.5 horas' },

  // Miércoles (2)
  { id: 'ev-13', day: 2, title: 'Trabajo de Grado U (Tesis)', category: 'thesis', start: '08:00', end: '12:30', notes: 'Desarrollo de entregable' },
  { id: 'ev-14', day: 2, title: 'Clase U: Asp. Gen. del Medio Ambiente', category: 'university', start: '14:00', end: '17:00', notes: 'Ingeniería' },
  { id: 'ev-15', day: 2, title: 'Clase U: Auditoría de Sistemas', category: 'university', start: '17:00', end: '20:00', notes: 'Ingeniería' },
  { id: 'ev-16', day: 2, title: 'Turno Outlier (Bloque Nocturno)', category: 'outlier', start: '20:30', end: '22:30', notes: '2 horas de apoyo' },
  { id: 'ev-17', day: 2, title: 'Dormir & Recuperación', category: 'rest', start: '22:30', end: '23:59', notes: 'Mínimo 7.5 hrs sueño' },

  // Jueves (3)
  { id: 'ev-18', day: 3, title: 'Trabajo de Grado U (Tesis)', category: 'thesis', start: '08:00', end: '12:30', notes: 'Documentación y código' },
  { id: 'ev-19', day: 3, title: 'Clase U: Ley y Ética para Ingeniería', category: 'university', start: '14:00', end: '17:00', notes: 'Ingeniería' },
  { id: 'ev-20', day: 3, title: 'Clase U: Práct. Emp. Apli. Trab. Grado', category: 'university', start: '18:00', end: '21:00', notes: 'Asignatura clave' },
  { id: 'ev-21', day: 3, title: 'Entrenamiento COARC (Árbitros)', category: 'referee', start: '19:15', end: '21:15', notes: 'Pruebas físicas arbitraje (Solapamiento con Práctica U)' },
  { id: 'ev-22', day: 3, title: 'Dormir & Recuperación', category: 'rest', start: '22:30', end: '23:59', notes: 'Descanso' },

  // Viernes (4)
  { id: 'ev-23', day: 4, title: 'Llevar a mis hermanas', category: 'family', start: '06:45', end: '07:20', notes: 'Colegio' },
  { id: 'ev-24', day: 4, title: 'Terapias Abuela', category: 'family', start: '07:30', end: '08:15', notes: 'Acompañamiento' },
  { id: 'ev-25', day: 4, title: 'Trabajo de Grado U (Tesis)', category: 'thesis', start: '08:30', end: '11:45', notes: 'Revisión final semana' },
  { id: 'ev-26', day: 4, title: 'Recoger a Avril', category: 'family', start: '12:45', end: '13:30', notes: 'Colegio' },
  { id: 'ev-27', day: 4, title: 'GYM Sesión Prime (Pierna & Potencia)', category: 'gym', start: '15:30', end: '16:45', notes: 'Piernas y sprints' },
  { id: 'ev-28', day: 4, title: 'Turno Outlier (Deep Work)', category: 'outlier', start: '18:00', end: '21:30', notes: '3.5 horas' },

  // Sábado (5)
  { id: 'ev-29', day: 5, title: 'Partidos de Arbitraje (Colegio COARC)', category: 'referee', start: '08:30', end: '13:00', notes: 'Torneo aficionado / formativo' },
  { id: 'ev-30', day: 5, title: 'Turno Outlier (Flexible)', category: 'outlier', start: '15:00', end: '18:30', notes: '3.5 horas remuneradas' },
  { id: 'ev-31', day: 5, title: 'Descanso / Social / Tiempo Libre', category: 'rest', start: '19:00', end: '22:30', notes: 'Desconexión' },

  // Domingo (6)
  { id: 'ev-32', day: 6, title: 'Misa', category: 'other', start: '08:00', end: '09:00', notes: 'Espiritual' },
  { id: 'ev-33', day: 6, title: 'Partidos de Arbitraje / Tarde', category: 'referee', start: '10:00', end: '13:30', notes: 'Partidos programados' },
  { id: 'ev-34', day: 6, title: 'Turno Outlier + Planeación Semanal', category: 'outlier', start: '16:00', end: '19:30', notes: '3.5 horas de trabajo' }
];

const ROUTINES = {
  push: {
    title: 'Día 1: Empuje (Pecho, Deltoides, Tríceps)',
    subtitle: 'Duración objetivo: 55 - 65 min. Foco en hipertrofia y fuerza.',
    exercises: [
      { name: 'Press de Banca Plano con Barra o Mancuernas', sets: 4, reps: '6 - 8', rpe: 'RPE 8.5', notes: '2 min descanso. Clave para torso superior.' },
      { name: 'Press Inclinado con Mancuernas (30°)', sets: 3, reps: '8 - 10', rpe: 'RPE 8', notes: 'Máximo estiramiento en la bajada.' },
      { name: 'Fondos en Paralelas o Máquina Asistida', sets: 3, reps: '8 - 12', rpe: 'RPE 8.5', notes: 'Inclinando levemente el torso hacia adelante.' },
      { name: 'Elevaciones Laterales con Mancuerna / Polea', sets: 4, reps: '12 - 15', rpe: 'RPE 9', notes: 'Hombro 3D, controlando la fase excéntrica.' },
      { name: 'Extensiones de Tríceps en Polea (Cuerda)', sets: 3, reps: '10 - 12', rpe: 'RPE 9', notes: 'Apertura al final del movimiento.' }
    ]
  },
  pull: {
    title: 'Día 2: Jalón (Espalda Completa, Bíceps, Deltoides Posterior)',
    subtitle: 'Duración objetivo: 60 min. Postura sólida para arbitraje y estudio.',
    exercises: [
      { name: 'Dominadas con peso corporal o Jalón al Pecho', sets: 4, reps: '8 - 10', rpe: 'RPE 8.5', notes: 'Escápulas retraídas en todo momento.' },
      { name: 'Remo con Barra o con Apoyo en Banco (Chest-supported)', sets: 4, reps: '8 - 10', rpe: 'RPE 8.5', notes: 'Protege la zona lumbar.' },
      { name: 'Remo Unilateral con Mancuerna (Kroc Row)', sets: 3, reps: '10 - 12', rpe: 'RPE 8', notes: 'Tirón hacia la cadera.' },
      { name: 'Face Pulls en Polea Alta', sets: 4, reps: '15', rpe: 'RPE 8', notes: 'Salud de manguito rotador y postura.' },
      { name: 'Curl de Bíceps Inclinado con Mancuernas', sets: 3, reps: '10 - 12', rpe: 'RPE 9', notes: 'Máximo estiramiento de cabeza larga.' }
    ]
  },
  legs: {
    title: 'Día 3: Pierna & Condición de Árbitro (COARC)',
    subtitle: 'Duración objetivo: 60 min. Potencia, sprints y resistencia.',
    exercises: [
      { name: 'Sentadilla Trasera con Barra o Sentadilla Hack', sets: 4, reps: '6 - 8', rpe: 'RPE 8.5', notes: 'Profundidad controlada.' },
      { name: 'Peso Muerto Rumano (RDL) con Mancuernas', sets: 4, reps: '8 - 10', rpe: 'RPE 8', notes: 'Isquios fuertes previenen desgarros en arbitraje.' },
      { name: 'Zancadas Dinámicas o Búlgaras', sets: 3, reps: '10 por pierna', rpe: 'RPE 8.5', notes: 'Estabilidad unilateral.' },
      { name: 'Elevación de Gemelos de Pie', sets: 4, reps: '15', rpe: 'RPE 9', notes: 'Pausa de 1s en contracción.' },
      { name: 'Sprints Intermitentes (15s sprint / 15s trote x 8)', sets: 1, reps: '8 rondas', rpe: 'RPE 9', notes: 'Simulación de prueba física COARC / FIFA.' }
    ]
  },
  express: {
    title: 'Rutina Express (35 Minutos - Días de Examen o Tesis)',
    subtitle: 'Para los días más cargados con la U: no falles tu racha, haz esto.',
    exercises: [
      { name: 'Superserie 1: Press Plano con Mancuernas + Jalón al Pecho', sets: 4, reps: '8 - 10', rpe: 'RPE 9', notes: 'Descanso 60s entre pares.' },
      { name: 'Superserie 2: Goblet Squat Pesada + Peso Muerto Rumano', sets: 3, reps: '10 - 12', rpe: 'RPE 8.5', notes: 'Descanso 60s entre pares.' },
      { name: 'Elevaciones Laterales + Plancha Abdominal (Core)', sets: 3, reps: '15 reps / 45s', rpe: 'RPE 9', notes: 'Intensidad continua.' }
    ]
  }
};

// State Variables
let scheduleData = JSON.parse(localStorage.getItem('prime_schedule')) || DEFAULT_SCHEDULE;
let currentDayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1; // 0 = Lunes, 6 = Domingo
let outlierRateUSD = parseFloat(localStorage.getItem('prime_outlier_rate') || '15');
let outlierSessions = JSON.parse(localStorage.getItem('prime_outlier_sessions')) || [
  { date: 'Jueves pasado', hours: 3.5, earnedUSD: 52.5 },
  { date: 'Viernes pasado', hours: 4.0, earnedUSD: 60.0 }
];
let savingsGoalCOP = 2000000;
let currentSavingsCOP = parseFloat(localStorage.getItem('prime_savings_current') || '1040000');
let savingsHistory = JSON.parse(localStorage.getItem('prime_savings_history')) || [
  { item: 'No compré comida rápida en la U', amount: 35000, date: 'Ayer' },
  { item: 'Ahorro de pago partido arbitraje', amount: 80000, date: 'Fin de semana' }
];

// Outlier Stopwatch state
let timerInterval = null;
let timerSeconds = 0;
let isTimerRunning = false;

// Rest Timer state
let restInterval = null;
let restRemaining = 90;

// Chart instance
let weeklyChartInstance = null;

// ==========================================
// 2. HELPER FUNCTIONS
// ==========================================

function formatTime(totalSeconds) {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function timeStringToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTimeString(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH}:${String(m).padStart(2, '0')} ${ampm}`;
}

function showToast(message) {
  const toast = document.getElementById('toastNotification');
  const toastMsg = document.getElementById('toastMessage');
  toastMsg.textContent = message;
  toast.style.display = 'flex';
  setTimeout(() => {
    toast.style.display = 'none';
  }, 3200);
}

function getCategoryName(category) {
  const map = {
    university: 'Universidad',
    thesis: 'Trabajo de Grado',
    family: 'Familia',
    outlier: 'Trabajo Outlier',
    referee: 'Arbitraje / COARC',
    gym: 'Entrenamiento GYM',
    rest: 'Descanso',
    other: 'General'
  };
  return map[category] || category;
}

// ==========================================
// 3. CONFLICT DETECTION ENGINE
// ==========================================

function detectDayConflicts(dayIndex) {
  const dayEvents = scheduleData.filter(e => e.day === dayIndex);
  const conflicts = [];

  for (let i = 0; i < dayEvents.length; i++) {
    for (let j = i + 1; j < dayEvents.length; j++) {
      const e1 = dayEvents[i];
      const e2 = dayEvents[j];
      const start1 = timeStringToMinutes(e1.start);
      const end1 = timeStringToMinutes(e1.end);
      const start2 = timeStringToMinutes(e2.start);
      const end2 = timeStringToMinutes(e2.end);

      // Overlap condition: start1 < end2 && end1 > start2
      if (start1 < end2 && end1 > start2) {
        conflicts.push({ eventA: e1, eventB: e2 });
      }
    }
  }
  return conflicts;
}

function calculateFreeSlots(dayIndex) {
  const dayEvents = scheduleData
    .filter(e => e.day === dayIndex)
    .sort((a, b) => timeStringToMinutes(a.start) - timeStringToMinutes(b.start));

  const freeSlots = [];
  // Consider waking day: 06:30 to 22:00 (390 to 1320 mins)
  let currentPointer = 390;

  for (const ev of dayEvents) {
    const evStart = timeStringToMinutes(ev.start);
    const evEnd = timeStringToMinutes(ev.end);

    if (evStart > currentPointer) {
      const gapLength = evStart - currentPointer;
      if (gapLength >= 45) { // Minimum 45 min gap
        freeSlots.push({
          startMinutes: currentPointer,
          endMinutes: evStart,
          duration: gapLength,
          startStr: minutesToTimeString(currentPointer),
          endStr: minutesToTimeString(evStart)
        });
      }
    }
    if (evEnd > currentPointer) {
      currentPointer = evEnd;
    }
  }

  // Check end of day gap until 22:00
  if (currentPointer < 1320) {
    const gapLength = 1320 - currentPointer;
    if (gapLength >= 45) {
      freeSlots.push({
        startMinutes: currentPointer,
        endMinutes: 1320,
        duration: gapLength,
        startStr: minutesToTimeString(currentPointer),
        endStr: minutesToTimeString(1320)
      });
    }
  }

  return freeSlots;
}

// ==========================================
// 4. RENDERING & UI UPDATES
// ==========================================

function updateDateDisplay() {
  const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const todayStr = new Date().toLocaleDateString('es-ES', dateOptions);
  document.getElementById('currentDateDisplay').textContent = todayStr.charAt(0).toUpperCase() + todayStr.slice(1);
}

function renderScheduleDay(dayIndex) {
  const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  document.getElementById('currentSelectedDayTitle').textContent = `${dayNames[dayIndex]} - Agenda del Día`;

  // Highlight active pill
  document.querySelectorAll('.day-pill').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.day) === dayIndex);
  });

  const timelineContainer = document.getElementById('timelineEventsList');
  timelineContainer.innerHTML = '';

  const dayEvents = scheduleData
    .filter(e => e.day === dayIndex)
    .sort((a, b) => timeStringToMinutes(a.start) - timeStringToMinutes(b.start));

  // Conflicts check
  const conflicts = detectDayConflicts(dayIndex);
  const conflictIds = new Set();
  conflicts.forEach(c => {
    conflictIds.add(c.eventA.id);
    conflictIds.add(c.eventB.id);
  });

  // Update conflict alert banner
  const alertBox = document.getElementById('conflictsAlertBox');
  const alertText = document.getElementById('conflictsAlertText');
  const conflictsBadge = document.getElementById('conflictsBadgeCount');
  conflictsBadge.textContent = conflicts.length;

  if (conflicts.length > 0) {
    alertBox.style.display = 'flex';
    alertText.innerHTML = conflicts.map(c => 
      `<strong>${c.eventA.title}</strong> (${c.eventA.start}-${c.eventA.end}) choca con <strong>${c.eventB.title}</strong> (${c.eventB.start}-${c.eventB.end}).`
    ).join('<br>');
  } else {
    alertBox.style.display = 'none';
  }

  // Calculate day total duration
  let totalMinutes = 0;
  dayEvents.forEach(ev => {
    const dur = timeStringToMinutes(ev.end) - timeStringToMinutes(ev.start);
    if (dur > 0) totalMinutes += dur;
  });
  const totalHours = (totalMinutes / 60).toFixed(1);
  document.getElementById('dayHoursTotalSummary').textContent = `${dayEvents.length} compromisos · ${totalHours} hrs programadas`;

  // Render events list
  if (dayEvents.length === 0) {
    timelineContainer.innerHTML = `
      <div class="text-center text-muted" style="padding: 2rem;">
        No tienes compromisos registrados este día. ¡Día totalmente libre!
      </div>
    `;
  } else {
    dayEvents.forEach(ev => {
      const durMinutes = timeStringToMinutes(ev.end) - timeStringToMinutes(ev.start);
      const isConflict = conflictIds.has(ev.id);

      const card = document.createElement('div');
      card.className = `timeline-card cat-${ev.category} ${isConflict ? 'has-conflict' : ''}`;
      card.innerHTML = `
        <div class="timeline-time-block">
          <span>${ev.start} – ${ev.end}</span>
          <span class="duration">${durMinutes} min</span>
        </div>
        <div class="timeline-card-content">
          <span class="event-category-tag">${getCategoryName(ev.category)} ${isConflict ? '⚠️ SOLAPAMIENTO' : ''}</span>
          <div class="event-title">${ev.title}</div>
          ${ev.notes ? `<div class="event-notes">${ev.notes}</div>` : ''}
        </div>
        <div class="event-actions-btns">
          <button class="btn-icon-delete" data-id="${ev.id}" title="Eliminar evento">🗑</button>
        </div>
      `;
      timelineContainer.appendChild(card);
    });
  }

  // Render Free Slots
  renderFreeSlots(dayIndex);
  updateDashboardKPIs();
}

function renderFreeSlots(dayIndex) {
  const freeSlotsContainer = document.getElementById('freeSlotsList');
  const freeSlots = calculateFreeSlots(dayIndex);
  freeSlotsContainer.innerHTML = '';

  if (freeSlots.length === 0) {
    freeSlotsContainer.innerHTML = `
      <div class="text-xs text-muted">Día muy comprimido. Intenta acortar bloques o delegar traslados.</div>
    `;
    return;
  }

  freeSlots.forEach(slot => {
    const card = document.createElement('div');
    card.className = 'free-slot-card';
    card.innerHTML = `
      <div>
        <div class="free-slot-time">${slot.startStr} – ${slot.endStr}</div>
        <div class="text-xs text-muted">Hueco de ${slot.duration} minutos</div>
      </div>
      <button class="btn-outline btn-xs btn-use-slot" data-day="${dayIndex}" data-start="${minutesToTimeString(slot.startMinutes)}" data-end="${minutesToTimeString(slot.endMinutes)}">
        + Asignar
      </button>
    `;
    freeSlotsContainer.appendChild(card);
  });

  // Attach slot click
  freeSlotsContainer.querySelectorAll('.btn-use-slot').forEach(btn => {
    btn.addEventListener('click', (e) => {
      openAddEventModal(dayIndex);
    });
  });
}

function updateDashboardKPIs() {
  // Weekly conflicts total
  let allConflicts = 0;
  for (let d = 0; d < 7; d++) {
    allConflicts += detectDayConflicts(d).length;
  }
  document.getElementById('kpiConflictsCount').textContent = allConflicts;

  // Best Gym Slot for Today
  const todayFree = calculateFreeSlots(currentDayIndex);
  const bestSlot = todayFree.find(s => s.duration >= 60 && s.duration <= 120) || todayFree[0];

  const timeDisplay = document.getElementById('recommendedSlotTime');
  const descDisplay = document.getElementById('recommendedSlotDesc');
  const badgeDisplay = document.getElementById('todayPrimeSlotBadge');

  if (bestSlot) {
    timeDisplay.textContent = `${bestSlot.startStr} – ${bestSlot.endStr}`;
    descDisplay.textContent = `Ventana perfecta de ${bestSlot.duration} min libres para tu entrenamiento Prime (60m) sin chocar con tus estudios.`;
    badgeDisplay.textContent = `${bestSlot.duration} min libres`;
  } else {
    timeDisplay.textContent = 'Día ajustado (35 min express)';
    descDisplay.textContent = 'Hoy tu agenda está al límite. Te recomendamos la rutina Express de 35 minutos en casa o gym.';
    badgeDisplay.textContent = 'Modo Express';
  }

  // Next commitment preview
  const dayEvents = scheduleData
    .filter(e => e.day === currentDayIndex)
    .sort((a, b) => timeStringToMinutes(a.start) - timeStringToMinutes(b.start));

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const nextEvent = dayEvents.find(e => timeStringToMinutes(e.start) >= currentMinutes) || dayEvents[0];

  const nextBox = document.getElementById('nextCommitmentText');
  if (nextEvent) {
    nextBox.textContent = `${nextEvent.start} - ${nextEvent.title} (${getCategoryName(nextEvent.category)})`;
  } else {
    nextBox.textContent = 'No hay más compromisos para hoy. ¡A descansar!';
  }

  // Update Prime Score
  updatePrimeScore();
}

function updatePrimeScore() {
  const chkGym = document.getElementById('checkGym').checked;
  const chkOutlier = document.getElementById('checkOutlier').checked;
  const chkStudies = document.getElementById('checkStudies').checked;
  const chkSavings = document.getElementById('checkSavings').checked;

  let score = 30; // Base baseline
  let completed = 0;
  if (chkGym) { score += 20; completed++; }
  if (chkOutlier) { score += 20; completed++; }
  if (chkStudies) { score += 20; completed++; }
  if (chkSavings) { score += 10; completed++; }

  document.getElementById('pillarsCompletedCount').textContent = `${completed} de 4 cumplidos`;
  document.getElementById('headerPrimeScoreValue').textContent = `${score}%`;

  const chip = document.getElementById('headerPrimeScoreChip');
  if (score >= 80) {
    chip.style.borderColor = 'var(--accent-prime)';
    chip.querySelector('.value').style.color = 'var(--accent-prime)';
  } else {
    chip.style.borderColor = 'rgba(6, 182, 212, 0.3)';
    chip.querySelector('.value').style.color = '#fff';
  }
}

// ==========================================
// 5. CHART.JS: WEEKLY DISTRIBUTION
// ==========================================

function renderWeeklyChart() {
  const ctx = document.getElementById('weeklyDistributionChart');
  if (!ctx) return;

  const categories = {
    university: 0,
    thesis: 0,
    outlier: 0,
    referee: 0,
    gym: 0,
    family: 0
  };

  scheduleData.forEach(ev => {
    const dur = (timeStringToMinutes(ev.end) - timeStringToMinutes(ev.start)) / 60;
    if (dur > 0 && categories[ev.category] !== undefined) {
      categories[ev.category] += dur;
    }
  });

  const dataValues = [
    categories.university.toFixed(1),
    categories.thesis.toFixed(1),
    categories.outlier.toFixed(1),
    categories.referee.toFixed(1),
    categories.gym.toFixed(1),
    categories.family.toFixed(1)
  ];

  if (weeklyChartInstance) {
    weeklyChartInstance.destroy();
  }

  weeklyChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Clases U', 'Trabajo de Grado', 'Outlier (3-4h/d)', 'Arbitraje (COARC)', 'Gym Prime', 'Familia'],
      datasets: [{
        label: 'Horas Semanales Dedicadas',
        data: dataValues,
        backgroundColor: [
          '#3b82f6',
          '#8b5cf6',
          '#10b981',
          '#f59e0b',
          '#06b6d4',
          '#ec4899'
        ],
        borderRadius: 8,
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#141820',
          titleColor: '#fff',
          bodyColor: '#9ca3af',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: function(ctx) {
              return ` ${ctx.raw} horas estimadas`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#9ca3af', font: { family: 'Plus Jakarta Sans', size: 11 } }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#9ca3af', font: { family: 'JetBrains Mono', size: 11 } }
        }
      }
    }
  });
}

// ==========================================
// 6. OUTLIER STOPWATCH & EARNINGS
// ==========================================

function updateTimerDisplay() {
  document.getElementById('outlierTimerDisplay').textContent = formatTime(timerSeconds);
}

function startOutlierTimer() {
  if (isTimerRunning) return;
  isTimerRunning = true;
  document.getElementById('btnStartOutlierTimer').disabled = true;
  document.getElementById('btnPauseOutlierTimer').disabled = false;
  document.getElementById('outlierTimerStatus').textContent = 'Trabajando en Outlier...';
  document.getElementById('outlierTimerStatus').style.color = 'var(--accent-prime)';

  timerInterval = setInterval(() => {
    timerSeconds++;
    updateTimerDisplay();
  }, 1000);
}

function pauseOutlierTimer() {
  if (!isTimerRunning) return;
  isTimerRunning = false;
  clearInterval(timerInterval);
  document.getElementById('btnStartOutlierTimer').disabled = false;
  document.getElementById('btnPauseOutlierTimer').disabled = true;
  document.getElementById('outlierTimerStatus').textContent = 'Sesión en pausa';
  document.getElementById('outlierTimerStatus').style.color = 'var(--accent-gold)';
}

function resetOutlierTimer() {
  pauseOutlierTimer();
  timerSeconds = 0;
  updateTimerDisplay();
  document.getElementById('outlierTimerStatus').textContent = 'Detenido';
  document.getElementById('outlierTimerStatus').style.color = 'var(--text-dim)';
}

function saveOutlierSessionHours(hours) {
  const earnedUSD = hours * outlierRateUSD;
  outlierSessions.unshift({
    date: 'Hoy (' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ')',
    hours: hours,
    earnedUSD: earnedUSD
  });
  localStorage.setItem('prime_outlier_sessions', JSON.stringify(outlierSessions));
  renderOutlierStats();
  showToast(`¡Sesión de ${hours.toFixed(1)}h de Outlier guardada! (+$${earnedUSD.toFixed(1)} USD)`);
  
  // Mark outlier checkbox as fulfilled
  document.getElementById('checkOutlier').checked = true;
  updatePrimeScore();
}

function renderOutlierStats() {
  let totalHours = outlierSessions.reduce((acc, curr) => acc + curr.hours, 0);
  let totalUSD = outlierSessions.reduce((acc, curr) => acc + curr.earnedUSD, 0);
  let approxCOP = totalUSD * 4000;

  document.getElementById('outlierWeekHours').textContent = `${totalHours.toFixed(1)} / 20 h`;
  document.getElementById('outlierWeekEarnings').textContent = `$${totalUSD.toFixed(1)} USD`;
  document.getElementById('outlierWeekCOP').textContent = `~$${approxCOP.toLocaleString('es-CO')} COP`;

  // History list
  const historyList = document.getElementById('outlierSessionsHistory');
  historyList.innerHTML = '';
  outlierSessions.slice(0, 5).forEach(s => {
    const item = document.createElement('div');
    item.className = 'session-item';
    item.innerHTML = `
      <div>
        <strong>${s.date}</strong>
        <span class="text-muted text-xs"> · ${s.hours.toFixed(1)} horas</span>
      </div>
      <span class="text-green font-mono">+$${s.earnedUSD.toFixed(1)} USD</span>
    `;
    historyList.appendChild(item);
  });
}

// ==========================================
// 7. ROUTINES RENDERER & REST TIMER
// ==========================================

function renderRoutine(routineKey) {
  const routine = ROUTINES[routineKey] || ROUTINES.push;
  document.getElementById('routineTitleDisplay').textContent = routine.title;
  document.getElementById('routineSubtitleDisplay').textContent = routine.subtitle;

  const tbody = document.getElementById('exercisesTableBody');
  tbody.innerHTML = '';

  routine.exercises.forEach((ex, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="checkbox" class="prime-checkbox ex-check" id="ex-${idx}"></td>
      <td><strong>${ex.name}</strong></td>
      <td><span class="badge">${ex.sets}</span></td>
      <td>${ex.reps}</td>
      <td><span class="badge badge-accent">${ex.rpe}</span></td>
      <td class="text-xs text-muted">${ex.notes}</td>
    `;
    tbody.appendChild(tr);
  });

  // Track check actions
  tbody.querySelectorAll('.ex-check').forEach(chk => {
    chk.addEventListener('change', () => {
      // Trigger rest timer automatically on finishing a set
      startRestCountdown();
    });
  });
}

function updateRestTimerDisplay() {
  const mins = Math.floor(restRemaining / 60);
  const secs = restRemaining % 60;
  document.getElementById('restTimerDisplay').textContent = 
    `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function startRestCountdown() {
  clearInterval(restInterval);
  restInterval = setInterval(() => {
    if (restRemaining > 0) {
      restRemaining--;
      updateRestTimerDisplay();
    } else {
      clearInterval(restInterval);
      showToast('⚡ ¡Descanso terminado! Vamos por la siguiente serie.');
    }
  }, 1000);
}

// ==========================================
// 8. FINANCIAL FILTER ("¿PUEDO O NO PUEDO?")
// ==========================================

function evaluateExpense(name, amountCOP, category) {
  const usdRateCOP = 4000;
  const outlierHourlyWageCOP = outlierRateUSD * usdRateCOP;
  const equivalentHours = amountCOP / outlierHourlyWageCOP;

  const resultBox = document.getElementById('decisionResultBox');
  const badge = document.getElementById('decisionBadge');
  const title = document.getElementById('decisionTitle');
  const advice = document.getElementById('decisionAdvice');

  resultBox.style.display = 'block';

  // Decision logic
  if (category === 'investment') {
    resultBox.className = 'decision-box approved-investment';
    badge.textContent = '✅ INVERSIÓN EN TU PRIME APROBADA';
    title.textContent = `Cuesta aprox. ${equivalentHours.toFixed(1)} horas de Outlier`;
    advice.textContent = `Este gasto contribuye directamente a tu rendimiento, salud o estudio. Vale la pena si mantienes tu disciplina.`;
  } else if (category === 'essential') {
    resultBox.className = 'decision-box approved-investment';
    badge.textContent = '🛡️ GASTO FIJO NECESARIO';
    title.textContent = `Equivale a ${equivalentHours.toFixed(1)} horas de Outlier`;
    advice.textContent = `Es un gasto indispensable para tu día a día o familia. Registra su impacto y optimiza en los no esenciales.`;
  } else {
    // Impulse, food outside, party
    resultBox.className = 'decision-box save-recommended';
    badge.textContent = '🚨 GASTO PRESCINDIBLE / FRENA AQUÍ';
    title.textContent = `¡Tendrás que trabajar ${equivalentHours.toFixed(1)} HORAS en Outlier solo para pagar esto!`;
    advice.textContent = `¿Realmente vale la pena cambiar ${equivalentHours.toFixed(1)} horas de tu tiempo concentrado por este capricho? Si decides ahorrarlo, te acercas a tu meta del mes.`;
  }

  // Setup action buttons
  document.getElementById('btnChooseToSave').onclick = () => {
    addSavingsRecord(`Ahorrado en vez de gastar en: ${name}`, amountCOP);
    resultBox.style.display = 'none';
    document.getElementById('expenseFilterForm').reset();
    showToast(`¡Increíble! Decidiste ahorrar $${amountCOP.toLocaleString('es-CO')} COP`);
  };

  document.getElementById('btnApproveExpense').onclick = () => {
    resultBox.style.display = 'none';
    document.getElementById('expenseFilterForm').reset();
    showToast(`Gasto de $${amountCOP.toLocaleString('es-CO')} COP registrado.`);
  };
}

function addSavingsRecord(item, amount) {
  currentSavingsCOP += amount;
  localStorage.setItem('prime_savings_current', currentSavingsCOP);

  savingsHistory.unshift({
    item: item,
    amount: amount,
    date: 'Hoy'
  });
  localStorage.setItem('prime_savings_history', JSON.stringify(savingsHistory));

  renderSavingsModule();
}

function renderSavingsModule() {
  const percent = Math.min(100, Math.round((currentSavingsCOP / savingsGoalCOP) * 100));
  document.getElementById('savingsProgressBar').style.width = `${percent}%`;
  document.getElementById('savingsProgressPercent').textContent = `${percent}%`;
  document.getElementById('currentSavingsDisplay').textContent = `$${currentSavingsCOP.toLocaleString('es-CO')} COP`;
  document.getElementById('goalSavingsDisplay').textContent = `$${savingsGoalCOP.toLocaleString('es-CO')} COP`;

  const historyContainer = document.getElementById('savingsHistoryList');
  historyContainer.innerHTML = '';
  savingsHistory.slice(0, 6).forEach(h => {
    const div = document.createElement('div');
    div.className = 'saving-item';
    div.innerHTML = `
      <div>
        <span>${h.item}</span>
        <span class="text-xs text-muted"> (${h.date})</span>
      </div>
      <span class="text-green font-mono">+$${h.amount.toLocaleString('es-CO')} COP</span>
    `;
    historyContainer.appendChild(div);
  });
}

// ==========================================
// 9. MODAL HANDLERS
// ==========================================

function openAddEventModal(defaultDay = 0) {
  const modal = document.getElementById('eventModal');
  document.getElementById('eventDaySelect').value = defaultDay;
  modal.style.display = 'flex';
}

function closeAddEventModal() {
  document.getElementById('eventModal').style.display = 'none';
  document.getElementById('eventForm').reset();
}

// ==========================================
// 10. EVENT LISTENERS & APP BOOTSTRAP
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  updateDateDisplay();
  renderScheduleDay(currentDayIndex);
  renderWeeklyChart();
  renderOutlierStats();
  renderRoutine('push');
  renderSavingsModule();

  // Navigation tab switching
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tabTarget = btn.dataset.tab;
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetEl = document.getElementById(tabTarget);
      if (targetEl) targetEl.classList.add('active');

      if (tabTarget === 'tab-dashboard') {
        renderWeeklyChart();
      }
    });
  });

  // Direct CTA buttons
  document.getElementById('btnGoToFullSchedule').addEventListener('click', () => {
    document.getElementById('btnTabSchedule').click();
  });
  document.getElementById('btnOpenWorkoutFromDash').addEventListener('click', () => {
    document.getElementById('btnTabWorkout').click();
  });
  document.getElementById('btnMarkWorkoutToday').addEventListener('click', () => {
    document.getElementById('checkGym').checked = true;
    updatePrimeScore();
    showToast('🏋️‍♂️ ¡Entrenamiento Prime de hoy completado!');
  });

  // Day selector in Schedule
  document.getElementById('daySelectorGroup').addEventListener('click', (e) => {
    if (e.target.classList.contains('day-pill')) {
      const day = parseInt(e.target.dataset.day);
      currentDayIndex = day;
      renderScheduleDay(day);
    }
  });

  // Modal open/close
  document.getElementById('btnQuickAddEvent').addEventListener('click', () => openAddEventModal(currentDayIndex));
  document.getElementById('btnAddScheduleItem').addEventListener('click', () => openAddEventModal(currentDayIndex));
  document.getElementById('btnCloseEventModal').addEventListener('click', closeAddEventModal);
  document.getElementById('btnCancelEventModal').addEventListener('click', closeAddEventModal);

  // Form submit new event
  document.getElementById('eventForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('eventTitleInput').value.trim();
    const day = parseInt(document.getElementById('eventDaySelect').value);
    const category = document.getElementById('eventCategorySelect').value;
    const start = document.getElementById('eventStartTime').value;
    const end = document.getElementById('eventEndTime').value;
    const notes = document.getElementById('eventNotes').value.trim();

    if (timeStringToMinutes(end) <= timeStringToMinutes(start)) {
      alert('La hora de fin debe ser posterior a la hora de inicio.');
      return;
    }

    const newEvent = {
      id: 'ev-' + Date.now(),
      day,
      title,
      category,
      start,
      end,
      notes
    };

    scheduleData.push(newEvent);
    localStorage.setItem('prime_schedule', JSON.stringify(scheduleData));
    closeAddEventModal();
    renderScheduleDay(day);
    renderWeeklyChart();
    showToast(`Evento "${title}" agregado a tu horario`);
  });

  // Delete event delegation
  document.getElementById('timelineEventsList').addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-icon-delete')) {
      const id = e.target.dataset.id;
      scheduleData = scheduleData.filter(ev => ev.id !== id);
      localStorage.setItem('prime_schedule', JSON.stringify(scheduleData));
      renderScheduleDay(currentDayIndex);
      renderWeeklyChart();
      showToast('Evento eliminado de tu horario');
    }
  });

  // Checklist updates
  document.querySelectorAll('.prime-checkbox').forEach(chk => {
    chk.addEventListener('change', updatePrimeScore);
  });

  // Outlier timer listeners
  document.getElementById('btnStartOutlierTimer').addEventListener('click', startOutlierTimer);
  document.getElementById('btnPauseOutlierTimer').addEventListener('click', pauseOutlierTimer);
  document.getElementById('btnResetOutlierTimer').addEventListener('click', resetOutlierTimer);
  document.getElementById('btnSaveOutlierSession').addEventListener('click', () => {
    if (timerSeconds < 60) {
      alert('Debes cronometrar al menos unos minutos para registrar la sesión.');
      return;
    }
    const hours = timerSeconds / 3600;
    saveOutlierSessionHours(hours);
    resetOutlierTimer();
  });

  // Manual hours add for outlier
  document.getElementById('btnSaveManualOutlier').addEventListener('click', () => {
    const input = document.getElementById('inputManualHours');
    const val = parseFloat(input.value);
    if (val && val > 0) {
      saveOutlierSessionHours(val);
      input.value = '';
    }
  });

  // Save hourly rate
  document.getElementById('btnSaveRate').addEventListener('click', () => {
    const val = parseFloat(document.getElementById('inputOutlierRate').value);
    if (val > 0) {
      outlierRateUSD = val;
      localStorage.setItem('prime_outlier_rate', outlierRateUSD);
      renderOutlierStats();
      showToast(`Tarifa actualizada a $${outlierRateUSD} USD/h`);
    }
  });

  // Workout tabs
  document.getElementById('routineSelectorTabs').addEventListener('click', (e) => {
    if (e.target.classList.contains('routine-tab')) {
      document.querySelectorAll('.routine-tab').forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      renderRoutine(e.target.dataset.routine);
    }
  });

  // Rest timer quick buttons
  document.querySelectorAll('.rest-quick-btns button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.rest-quick-btns button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      restRemaining = parseInt(btn.dataset.time);
      updateRestTimerDisplay();
    });
  });

  document.getElementById('btnStartRestTimer').addEventListener('click', startRestCountdown);
  document.getElementById('btnResetRestTimer').addEventListener('click', () => {
    clearInterval(restInterval);
    const activeBtn = document.querySelector('.rest-quick-btns button.active');
    restRemaining = activeBtn ? parseInt(activeBtn.dataset.time) : 90;
    updateRestTimerDisplay();
  });

  document.getElementById('btnLogWorkoutComplete').addEventListener('click', () => {
    document.getElementById('checkGym').checked = true;
    updatePrimeScore();
    showToast('🏋️‍♂️ ¡Rutina completada! Has sumado a tu Prime.');
  });

  // Expense filter form
  document.getElementById('expenseFilterForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('expenseName').value.trim();
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const category = document.getElementById('expenseCategory').value;
    evaluateExpense(name, amount, category);
  });

  // Quick add saving
  document.getElementById('btnQuickAddSaving').addEventListener('click', () => {
    const amountStr = prompt('¿Cuánto dinero vas a enviar a tu meta de ahorro hoy? (en COP):', '50000');
    if (amountStr) {
      const amount = parseFloat(amountStr);
      if (amount > 0) {
        addSavingsRecord('Depósito manual de ahorro', amount);
        showToast(`+$${amount.toLocaleString('es-CO')} COP agregados a tu meta de ahorro.`);
      }
    }
  });

  // Finish splash screen
  if (typeof window !== 'undefined' && typeof window.primeSplashDone === 'function') {
    window.primeSplashDone();
  }
});
