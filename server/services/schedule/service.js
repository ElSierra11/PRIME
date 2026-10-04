/**
 * Microservice: Schedule & Conflict Engine Service
 * Manages weekly calendar, conflict auditor, and Prime window calculation.
 */

const fs = require('fs');
const path = require('path');
const supabase = require('../supabase');

const DATA_FILE = path.join(__dirname, 'schedule_data.json');

const INITIAL_SCHEDULE = [
  // Lunes (0)
  { id: 'ev-1', day: 0, title: 'Levantarme & Llevar a mis hermanas', category: 'family', start: '06:30', end: '07:15', notes: 'Colegio' },
  { id: 'ev-2', day: 0, title: 'Clase U: Gestión y Calidad del Software', category: 'university', start: '09:00', end: '12:00', notes: 'Materia obligatoria U' },
  { id: 'ev-3', day: 0, title: 'Trabajo de Grado U (Tesis)', category: 'thesis', start: '10:00', end: '12:30', notes: 'Avance con asesor (Solapamiento con clase)' },
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

class ScheduleService {
  constructor() {
    this.events = this.loadData();
  }

  loadData() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      }
    } catch (e) {
      console.error('Error cargando schedule_data.json:', e);
    }
    return INITIAL_SCHEDULE;
  }

  saveData() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.events, null, 2), 'utf8');
    } catch (e) {
      console.error('Error guardando schedule_data.json:', e);
    }
  }

  timeToMinutes(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  }

  minutesToTime(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH}:${String(m).padStart(2, '0')} ${ampm}`;
  }

  async getAllEvents() {
    if (supabase.isConfigured()) {
      const records = await supabase.select('schedule_events', 'order=day.asc,start_time.asc');
      if (records && records.length > 0) {
        this.events = records.map(r => ({
          id: r.id,
          day: r.day,
          title: r.title,
          category: r.category,
          start: r.start_time,
          end: r.end_time,
          notes: r.notes || ''
        }));
      }
    }
    return { success: true, events: this.events };
  }

  async getEventsByDay(day) {
    const dayIndex = parseInt(day);
    const dayEvents = this.events
      .filter(e => e.day === dayIndex)
      .sort((a, b) => this.timeToMinutes(a.start) - this.timeToMinutes(b.start));

    const conflicts = this.getConflicts(dayIndex);
    const freeSlots = this.getFreeSlots(dayIndex);

    return { success: true, dayIndex, events: dayEvents, conflicts, freeSlots };
  }

  getConflicts(dayIndex) {
    const dayEvents = this.events.filter(e => e.day === dayIndex);
    const conflicts = [];

    for (let i = 0; i < dayEvents.length; i++) {
      for (let j = i + 1; j < dayEvents.length; j++) {
        const e1 = dayEvents[i];
        const e2 = dayEvents[j];
        const s1 = this.timeToMinutes(e1.start);
        const e1End = this.timeToMinutes(e1.end);
        const s2 = this.timeToMinutes(e2.start);
        const e2End = this.timeToMinutes(e2.end);

        if (s1 < e2End && e1End > s2) {
          conflicts.push({ eventA: e1, eventB: e2 });
        }
      }
    }
    return conflicts;
  }

  getFreeSlots(dayIndex) {
    const dayEvents = this.events
      .filter(e => e.day === dayIndex)
      .sort((a, b) => this.timeToMinutes(a.start) - this.timeToMinutes(b.start));

    const freeSlots = [];
    let currentPointer = 390; // 06:30 AM

    for (const ev of dayEvents) {
      const evStart = this.timeToMinutes(ev.start);
      const evEnd = this.timeToMinutes(ev.end);

      if (evStart > currentPointer) {
        const duration = evStart - currentPointer;
        if (duration >= 40) {
          freeSlots.push({
            startMinutes: currentPointer,
            endMinutes: evStart,
            duration,
            startStr: this.minutesToTime(currentPointer),
            endStr: this.minutesToTime(evStart)
          });
        }
      }
      if (evEnd > currentPointer) {
        currentPointer = evEnd;
      }
    }

    if (currentPointer < 1320) { // 10:00 PM
      const duration = 1320 - currentPointer;
      if (duration >= 40) {
        freeSlots.push({
          startMinutes: currentPointer,
          endMinutes: 1320,
          duration,
          startStr: this.minutesToTime(currentPointer),
          endStr: this.minutesToTime(1320)
        });
      }
    }

    return freeSlots;
  }

  async addEvent(eventData) {
    const newEvent = {
      id: 'ev-' + Date.now(),
      day: parseInt(eventData.day),
      title: eventData.title,
      category: eventData.category || 'other',
      start: eventData.start,
      end: eventData.end,
      notes: eventData.notes || ''
    };
    this.events.push(newEvent);
    this.saveData();

    if (supabase.isConfigured()) {
      await supabase.insert('schedule_events', {
        id: newEvent.id,
        day: newEvent.day,
        title: newEvent.title,
        category: newEvent.category,
        start_time: newEvent.start,
        end_time: newEvent.end,
        notes: newEvent.notes
      });
    }

    return { success: true, event: newEvent };
  }

  async deleteEvent(id) {
    this.events = this.events.filter(e => e.id !== id);
    this.saveData();

    if (supabase.isConfigured()) {
      await supabase.delete('schedule_events', 'id', id);
    }

    return { success: true, deletedId: id };
  }

  generateICS(filterDay = null) {
    const dayMapRRule = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sun, 1 = Mon...
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMonday);

    const pad = (n) => String(n).padStart(2, '0');
    const formatDateTime = (date, timeStr) => {
      const [h, m] = (timeStr || '09:00').split(':').map(Number);
      const y = date.getFullYear();
      const mo = pad(date.getMonth() + 1);
      const d = pad(date.getDate());
      return `${y}${mo}${d}T${pad(h)}${pad(m)}00`;
    };

    const targetEvents = filterDay !== null && filterDay !== undefined && filterDay !== ''
      ? this.events.filter(e => e.day === parseInt(filterDay))
      : this.events;

    const dtstamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

    let ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//PRIME OS//Alejo Sierra//ES',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:PRIME OS - Horario Alejo',
      'X-WR-TIMEZONE:America/Bogota',
      'X-WR-CALDESC:Horario universitario, Trabajo de Grado, COARC, Outlier y entrenamientos',
      'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
      'X-PUBLISHED-TTL:PT1H',
      'BEGIN:VTIMEZONE',
      'TZID:America/Bogota',
      'X-LIC-LOCATION:America/Bogota',
      'BEGIN:STANDARD',
      'TZOFFSETFROM:-0500',
      'TZOFFSETTO:-0500',
      'TZNAME:COT',
      'DTSTART:19700101T000000',
      'END:STANDARD',
      'END:VTIMEZONE'
    ];

    targetEvents.forEach((ev) => {
      const eventDate = new Date(monday);
      eventDate.setDate(monday.getDate() + (ev.day >= 0 && ev.day <= 6 ? ev.day : 0));

      const dtStart = formatDateTime(eventDate, ev.start);
      const dtEnd = formatDateTime(eventDate, ev.end);
      const rruleDay = dayMapRRule[ev.day] || 'MO';

      const categoryName = {
        university: 'Universidad / Clases',
        thesis: 'Trabajo de Grado (Tesis)',
        referee: 'Arbitraje COARC',
        gym: 'Entrenamiento Gimnasio',
        outlier: 'Outlier AI Work',
        family: 'Familia',
        rest: 'Recuperación / Descanso'
      }[ev.category] || 'Compromiso';

      ics.push('BEGIN:VEVENT');
      ics.push(`UID:${ev.id}-${Date.now()}@prime-os.local`);
      ics.push(`DTSTAMP:${dtstamp}`);
      ics.push(`DTSTART;TZID=America/Bogota:${dtStart}`);
      ics.push(`DTEND;TZID=America/Bogota:${dtEnd}`);
      ics.push(`RRULE:FREQ=WEEKLY;BYDAY=${rruleDay}`);
      ics.push(`SUMMARY:${ev.title.replace(/[,;]/g, ' ')}`);
      ics.push(`DESCRIPTION:${(ev.notes || categoryName).replace(/[\r\n]+/g, ' ')} - Categoría: ${categoryName}`);
      ics.push(`CATEGORIES:${categoryName}`);
      ics.push('STATUS:CONFIRMED');
      ics.push('BEGIN:VALARM');
      ics.push('TRIGGER:-PT15M');
      ics.push('ACTION:DISPLAY');
      ics.push(`DESCRIPTION:Recordatorio Prime: ${ev.title.replace(/[,;]/g, ' ')}`);
      ics.push('END:VALARM');
      ics.push('END:VEVENT');
    });

    ics.push('END:VCALENDAR');
    return ics.join('\r\n');
  }
}

module.exports = new ScheduleService();
