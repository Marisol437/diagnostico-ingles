// ====== CONFIGURACIÓN (puedes editar sin miedo) ======
const WHATSAPP_NUMBER = "57XXXXXXXXXX"; // <-- Pon tu número con indicativo (ej: 573001234567). Sin + ni espacios.

const QUESTIONS = [
  {
    id: "need_soon",
    title: "1)¿Necesita usar inglés en su vida profesional o en su vida diaria?",
    help: "Evaluación breve para confirmar si Step Up es la opción adecuada para usted.",
    answers: [
      { label: "Sí", value: "yes", next: "reason" },
      { label: "No", value: "no", next: "result_no" },
    ],
  },
  {
    id: "reason",
    title: "2) ¿Para qué lo necesitas?",
    help: "Esto define tu ruta principal.",
    answers: [
      { label: "Trabajo", value: "work", next: "level" },
      { label: "Estudio", value: "study", next: "level" },
      { label: "Viajes", value: "travel", next: "level" },
      { label: "Cultura general", value: "culture", next: "level" },
    ],
  },
  {
    id: "level",
    title: "3) ¿Cuál es tu nivel actual?",
    help: "El nivel define la complejidad del plan.",
    answers: [
      { label: "Cero / Muy básico", value: "A0-A1", next: "time" },
      { label: "Básico", value: "A2", next: "time" },
      { label: "Intermedio o más", value: "B1+", next: "time" },
    ],
  },
  {
    id: "time",
    title: "4) ¿Cuánto tiempo real puedes dedicar por semana?",
    help: "Sin tiempo real, no hay resultados.",
    answers: [
      { label: "Menos de 2 horas", value: "<2h", next: "budget" },
      { label: "2 a 4 horas", value: "2-4h", next: "budget" },
      { label: "5+ horas", value: "5+h", next: "budget" },
    ],
  },
  {
    id: "budget",
    title: "5) ¿Tienes presupuesto para entrenamiento guiado?",
    help: "No es juicio; solo define si eres lead caliente o frío.",
    answers: [
      { label: "Sí", value: "yes", next: "channel" },
      { label: "No por ahora", value: "no", next: "result_cold" },
    ],
  },
  {
    id: "channel",
    title: "6) ¿Cuál canal prefieres para el siguiente paso?",
    help: "Esto define tu llamada a la acción.",
    answers: [
      { label: "WhatsApp", value: "whatsapp", next: "result_yes" },
      { label: "Email", value: "email", next: "result_yes" },
      { label: "Llamada", value: "call", next: "result_yes" },
    ],
  },
];

// Resultados
const RESULTS = {
  result_no: {
    qualifies: "NO",
    route: "Lead no urgente",
    nextStep: "Ofrecer recurso gratuito + invitar a volver cuando haya urgencia",
    message: "No hay urgencia (3 meses). No se descarta para siempre: se nutre como lead frío.",
  },
  result_cold: {
    qualifies: "NO (por ahora)",
    route: "Lead frío",
    nextStep: "Enviar recurso gratuito + opción de plan autoguiado",
    message: "Hay necesidad, pero sin presupuesto. Recomendado: ruta de bajo costo y seguimiento.",
  },
  result_yes: {
    qualifies: "SÍ",
    route: "Cliente potencial",
    nextStep: "Agendar llamada corta / enviar propuesta",
    message: "Califica: hay urgencia + presupuesto + canal definido.",
  },
};

// ====== LÓGICA DE APP ======
const card = document.getElementById("card");
const resultCard = document.getElementById("result");
const qTitle = document.getElementById("qTitle");
const qHelp = document.getElementById("qHelp");
const answersEl = document.getElementById("answers");
const bar = document.getElementById("bar");
const backBtn = document.getElementById("backBtn");
const resetBtn = document.getElementById("resetBtn");

const resultBox = document.getElementById("resultBox");
const waBtn = document.getElementById("waBtn");
const copyBtn = document.getElementById("copyBtn");

let history = [];
let state = {
  current: QUESTIONS[0].id,
  responses: {}, // {questionId: {label, value}}
};

function findQuestion(id) {
  return QUESTIONS.find(q => q.id === id);
}

function progressPct() {
  const answered = Object.keys(state.responses).length;
  const total = QUESTIONS.length;
  return Math.min(100, Math.round((answered / total) * 100));
}

function render() {
  const pct = progressPct();
  bar.style.width = pct + "%";

  // Si es resultado
  if (state.current.startsWith("result_")) {
    showResult(state.current);
    return;
  }

  const q = findQuestion(state.current);
  qTitle.textContent = q.title;
  qHelp.textContent = q.help || "";
  answersEl.innerHTML = "";

  q.answers.forEach(a => {
    const btn = document.createElement("button");
    btn.className = "answerBtn";
    btn.type = "button";
    btn.textContent = a.label;
    btn.addEventListener("click", () => {
      history.push(state.current);
      state.responses[q.id] = { label: a.label, value: a.value };
      state.current = a.next;
      render();
    });
    answersEl.appendChild(btn);
  });

  backBtn.disabled = history.length === 0;
}

function buildSummary(resultId) {
  const res = RESULTS[resultId];
  const lines = [];

  lines.push("DIAGNÓSTICO STEP UP");
  lines.push("-------------------");
  lines.push(`Califica: ${res.qualifies}`);
  lines.push(`Ruta: ${res.route}`);
  lines.push("");

  // Respuestas
  lines.push("Respuestas:");
  for (const q of QUESTIONS) {
    if (state.responses[q.id]) {
      lines.push(`- ${q.title.replace(/^\d+\)\s*/, "")}: ${state.responses[q.id].label}`);
    }
  }

  lines.push("");
  lines.push("Siguiente paso recomendado:");
  lines.push(`- ${res.nextStep}`);
  lines.push("");
  lines.push(res.message);

  return lines.join("\n");
}

function showResult(resultId) {
  card.classList.add("hidden");
  resultCard.classList.remove("hidden");

  const summary = buildSummary(resultId);
  resultBox.textContent = summary;

  // WhatsApp link
  const encoded = encodeURIComponent(summary);
  const numberOk = WHATSAPP_NUMBER && WHATSAPP_NUMBER !== "57XXXXXXXXXX";
  const waBase = numberOk
    ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;

  waBtn.href = waBase;

  copyBtn.onclick = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      copyBtn.textContent = "¡Copiado!";
      setTimeout(() => (copyBtn.textContent = "Copiar resumen"), 1200);
    } catch {
      alert("No pude copiar. Selecciona el texto y cópialo manualmente.");
    }
  };
}

function resetAll() {
  history = [];
  state = { current: QUESTIONS[0].id, responses: {} };
  resultCard.classList.add("hidden");
  card.classList.remove("hidden");
  render();
}

backBtn.addEventListener("click", () => {
  if (history.length === 0) return;
  const prev = history.pop();

  // borrar respuesta de la pregunta actual anterior (la última contestada)
  // Identificamos cuál fue la pregunta que se respondió para llegar aquí:
  // Tomamos la pregunta "prev" como la que se estaba mostrando antes.
  // Además, si retrocedes desde una pregunta, borramos la respuesta de esa pregunta.
  const currentQ = findQuestion(prev);
  if (currentQ && state.responses[currentQ.id]) {
    delete state.responses[currentQ.id];
  }

  state.current = prev;
  render();
});

resetBtn.addEventListener("click", resetAll);

// Start
render();


