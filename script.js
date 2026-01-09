// ====== CONFIGURACIÓN (puedes editar sin miedo) ======
const WHATSAPP_NUMBER = "573167850234"; // <-- Pon tu número con indicativo (ej: 573001234567). Sin + ni espacios.

const QUESTIONS = [
  {
    id: "need_soon",
    title: "1) ¿Necesita usar inglés en su vida profesional o en su vida diaria?",
    help: "Evaluación breve para confirmar si Step Up es la opción adecuada para usted.",
    answers: [
      { label: "Sí", value: "yes", next: "reason" },
      { label: "No", value: "no", next: "result_no" },
    ],
  },
  {
    id: "reason",
    title: "2) ¿Para qué lo necesita?",
    help: "Esto define su ruta principal.",
    answers: [
      { label: "Trabajo", value: "work", next: "level" },
      { label: "Estudio", value: "study", next: "level" },
      { label: "Viajes", value: "travel", next: "level" },
      { label: "Cultura general", value: "culture", next: "level" },
    ],
  },
  {
    id: "level",
    title: "3) ¿Cuál es su nivel actual?",
    help: "El nivel define la complejidad del plan.",
    answers: [
      { label: "Cero / Muy básico", value: "A0-A1", next: "time" },
      { label: "Básico", value: "A2", next: "time" },
      { label: "Intermedio o más", value: "B1+", next: "time" },
    ],
  },
  {
    id: "time",
    title: "4) ¿Cuánto tiempo real puede dedicar por semana?",
    help: "Sin tiempo real, no hay resultados.",
    answers: [
      { label: "Menos de 2 horas", value: "<2h", next: "budget" },
      { label: "2 a 4 horas", value: "2-4h", next: "budget" },
      { label: "5+ horas", value: "5+h", next: "budget" },
    ],
  },
  {
    id: "budget",
    title: "5) ¿Cuenta con presupuesto para entrenamiento guiado?",
    help: "Esta respuesta solo define el tipo de ruta recomendada.",
    answers: [
      { label: "Sí", value: "yes", next: "channel" },
      { label: "No por ahora", value: "no", next: "result_cold" },
    ],
  },
  {
    id: "channel",
    title: "6) ¿Qué canal prefiere para el siguiente paso?",
    help: "Esto define la acción recomendada.",
    answers: [
      { label: "WhatsApp", value: "whatsapp", next: "result_yes" },
      { label: "Email", value: "email", next: "result_yes" },
      { label: "Llamada", value: "call", next: "result_yes" },
    ],
  },
];

// ====== RESULTADOS (lo que ve el usuario en pantalla) ======
const RESULTS = {
  result_no: {
    // Interno (si lo necesitas para ti). No se muestra al usuario.
    qualifies: "",
    route: "",
    nextStep: "",
    // Usuario (esto SÍ se muestra)
    message: `
      <h2>Gracias por responder</h2>
      <p>
        En este momento, Step Up está diseñado para personas que necesitan usar
        inglés en su vida profesional o en su vida diaria.
      </p>
      <p>Esperamos poder servirle en un futuro próximo.</p>
    `,
  },

  result_cold: {
    qualifies: "",
    route: "",
    nextStep: "",
    message: `
      <h2>Ruta recomendada</h2>
      <p>
        Con base en sus respuestas, una ruta autoguiada puede ser el mejor inicio en este momento.
      </p>
      <p>
        Si desea, puede escribirnos para recibir una recomendación puntual de recursos y próximos pasos.
      </p>
    `,
  },

  result_yes: {
    qualifies: "",
    route: "",
    nextStep: "",
    message: `
      <h2>Ruta recomendada</h2>
      <p>
        Con base en sus respuestas, lo más eficiente es continuar con el Diagnóstico de Inglés Profesional.
      </p>
      <p>
        Seleccione su canal preferido y continúe para coordinar el siguiente paso.
      </p>
    `,
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
  return QUESTIONS.find((q) => q.id === id);
}

function progressPct() {
  const answered = Object.keys(state.responses).length;
  const total = QUESTIONS.length;
  return Math.min(100, Math.round((answered / total) * 100));
}

function stripHtml(html) {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || "").trim();
}

// Resumen interno SOLO para Copiar/WhatsApp (no se muestra)
function buildInternalSummary(resultId) {
  const res = RESULTS[resultId];
  const lines = [];

  lines.push("STEP UP — PRESELECCIÓN");
  lines.push("----------------------");

  lines.push("Respuestas:");
  for (const q of QUESTIONS) {
    const r = state.responses[q.id];
    if (r) lines.push(`- ${q.title.replace(/^\d+\)\s*/, "")}: ${r.label}`);
  }

  lines.push("");
  lines.push("Mensaje mostrado al usuario:");
  lines.push(stripHtml(res.message));

  return lines.join("\n");
}

function render() {
  bar.style.width = progressPct() + "%";

  if (state.current.startsWith("result_")) {
    showResult(state.current);
    return;
  }

  const q = findQuestion(state.current);
  qTitle.textContent = q.title;
  qHelp.textContent = q.help || "";
  answersEl.innerHTML = "";

  q.answers.forEach((a) => {
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

function showResult(resultId) {
  card.classList.add("hidden");
  resultCard.classList.remove("hidden");

  // 1) UI para usuario: SOLO mensaje (HTML)
  resultBox.innerHTML = RESULTS[resultId].message;

  // 2) Interno para ti (copiar / WhatsApp)
  const summary = buildInternalSummary(resultId);

  // WhatsApp link
  const encoded = encodeURIComponent(summary);
  const numberOk = WHATSAPP_NUMBER && WHATSAPP_NUMBER !== "57XXXXXXXXXX";
  waBtn.href = numberOk
    ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;

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
