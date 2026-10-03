# ⚡ PRIME OS (React + Tailwind + Microservicios Node.js)

Bienvenido a tu sistema **PRIME OS**, diseñado a medida para **Alejo Sierra (`alejosierra656@gmail.com`)**.

La app fue reconstruida desde cero para eliminar cualquier aspecto genérico de IA, adoptando un diseño estético, reactivo e hiper-interactivo con **paleta de azul medio claro (`#38bdf8`, `#0284c7`), blanco nítido y fondo oscuro adaptado (`#070c18`)**.

---

## 🏗️ Arquitectura de Microservicios (Backend Node.js)

Se adoptó **Node.js** para el backend (recomendado por encima de Python para esta solución al compartir ecosistema con React, sintaxis unificada de JSON, Web Audio API y respuesta ultra-rápida sin conflictos de entornos virtuales).

```
PRIME/
├── client/                     # Frontend React + Tailwind CSS + Lucide Icons + Web Audio API
│   ├── src/
│   │   ├── components/         # Navbar, DuolingoSleepModal, WaterTrackerWidget, ToastContainer
│   │   ├── tabs/               # DashboardTab, ScheduleTab, OutlierTab, WorkoutTab, FinanceTab
│   │   ├── utils/audio.js      # Sintetizador de sonido por Web Audio API (cero archivos rotos)
│   │   ├── App.jsx             # Orquestador del estado y llamadas a microservicios
│   │   └── index.css           # Estilos Tailwind y animaciones interactivas
│   └── vite.config.js          # Configuración Vite con proxy a Gateway
│
├── server/                     # Arquitectura de Microservicios
│   ├── gateway.js              # API Gateway / Router unificado en el puerto 5000 (y sirve el frontend)
│   └── services/
│       ├── auth/service.js     # Perfil exclusivo de alejosierra656@gmail.com
│       ├── schedule/service.js # Horario con detección de conflictos y ventanas libres
│       ├── outlier/service.js  # Turnos diarios 3-4h, ganancias en USD y COP
│       ├── habits/service.js   # Alarma de sueño estilo Duolingo, tracker de agua y quehaceres
│       └── finance/service.js  # Filtro de ahorro ("¿Puedo o no puedo?") y meta de $2M COP
```

---

## 🌟 Funcionalidades Interactivas Clave

### 1. Alarma de Sueño Estilo Duolingo ("Modo Tóxico / Disciplina Prime")
- **Horario programado:** 10:00 PM (22:00).
- **Comportamiento:** Dispara una alarma sonora persistente y una ventana modal interactiva con vibración visual.
- **Exigencia:** No te permite ignorarla fácilmente; te muestra la lista de tus quehaceres pendientes (tesis, outlier, gym, agua) y requiere que confirmes: *"¡Ya me voy a dormir, apagando pantallas!"* para silenciarla.
- **Botón de prueba:** Puedes probarla en cualquier momento desde el botón `Alarma Duolingo` en la barra superior.

### 2. Tracker Interactivo de Agua (2.5L / día)
- Gráfico dinámico de nivel de agua.
- Botones rápidos: `+250 ml (Vaso)` y `+500 ml (Botella)`.
- Efecto sonoro de gota de agua sintetizado y notificaciones Toast en tiempo real.

### 3. Horarios Semanales & Auditor de Conflictos
- **Tus horarios reales precargados:** Clases de Ingeniería (*Gestión y Calidad*, *Medio Ambiente*, *Auditoría*, *Ética*, *Prácticas*), Trabajo de Grado, Terapias de tu abuela, recogida de hermanas, y COARC.
- **Alerta de Solapamiento:** Resalta en vivo cruces de agenda (ej. jueves entre la clase de práctica y el entrenamiento físico de árbitros COARC).
- **Detector de Ventana Prime:** Calcula los huecos libres exactos del día para entrenar 60m sin descuidar la universidad.
- **Botón `+ Agregar Compromiso`:** Permite ingresar nuevos eventos por categoría.

### 4. Outlier Tracker (Meta diaria: 3 a 4 Horas)
- Cronómetro en vivo con inicio, pausa y guardado de turnos.
- Ingreso manual de horas adicionales.
- Conversión financiera automática: tarifa configurable ($15 USD/h por defecto) con acumulado semanal en **USD** y **COP**.

### 5. Rutinas Gym 60 Minutos
- Rutinas de **Empuje**, **Jalón**, **Pierna & Árbitro COARC** (con trabajo de prevención de desgarros de isquiotibiales y sprints) y **Express 35m**.
- Cronómetro de descanso entre series con botones de 60s, 90s y 120s y alerta de fin de descanso.

### 6. Filtro de Ahorro ("¿Puedo o no puedo permitirme este gasto?")
- Calculadora de **Costo de Oportunidad**: Ingresas cualquier antojo en pesos COP (ej. $45,000 COP) y te dice a cuántas **horas de trabajo en Outlier** equivale.
- Botón **"Decido Ahorrarlo (+ Ahorro)"**: Suma ese monto directamente a tu meta mensual de ahorro ($2,000,000 COP) y lo guarda en tus victorias financieras.

---

## 🚀 Cómo Iniciar la App

La aplicación está lista y corriendo en:
👉 **[http://localhost:5000](http://localhost:5000)**

Para reiniciarla en cualquier momento desde tu terminal:
```bash
node server/gateway.js
```

Y para desarrollo en caliente con Vite:
```bash
cd client
npm run dev
```
