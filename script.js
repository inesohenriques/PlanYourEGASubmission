const form = document.getElementById("survey");
const steps = [...document.querySelectorAll(".question-card")];
const nextBtn = document.getElementById("nextBtn");
const backBtn = document.getElementById("backBtn");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");
const results = document.getElementById("results");
const addedWeeksEl = document.getElementById("addedWeeks");
const totalTimelineEl = document.getElementById("totalTimeline");
const checklistEl = document.getElementById("checklist");

let currentStep = 1;
let stopped = false;

function visibleSteps() {
  return steps.filter(s => !s.classList.contains("hidden"));
}

function showStep(n) {
  visibleSteps().forEach(s => s.classList.remove("active"));
  const target = steps.find(s => s.dataset.step === String(n));
  if (!target || target.classList.contains("hidden")) return;
  target.classList.add("active");
  currentStep = n;
  updateProgress();
  backBtn.classList.toggle("hidden", n === 1);
  nextBtn.textContent = n === 4 ? "See my results" : "Continue";
  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

function updateProgress() {
  const count = 4;
  progressBar.style.width = `${Math.min(100, (currentStep / count) * 100)}%`;
  progressText.textContent = `Question ${currentStep} of ${count}`;
}

function selected(name) {
  return [...form.querySelectorAll(`[name="${name}"]:checked`)].map(x => x.value);
}

function clearConditionalDisplays() {
  document.getElementById("notReady").classList.add("hidden");
  document.getElementById("sharingUnknown").classList.add("hidden");
  document.getElementById("sharingNo").classList.add("hidden");
}

function validateStep() {
  const q = currentStep;
  if (q === 1) {
    const value = selected("sequenced")[0];
    if (!value) return false;
    if (value === "no") {
      document.getElementById("notReady").classList.remove("hidden");
      stopped = true;
      nextBtn.classList.add("hidden");
      backBtn.classList.add("hidden");
      return false;
    }
  }
  if (q === 1.1) {
    if (!selected("sequencing").length) return false;
  }
  if (q === 2) {
    if (!selected("origin").length) return false;
  }
  if (q === 2.1) {
    const value = selected("sharing")[0];
    if (!value) return false;
    if (value === "no") {
      document.getElementById("sharingNo").classList.remove("hidden");
      stopped = true;
      nextBtn.classList.add("hidden");
      backBtn.classList.add("hidden");
      return false;
    }
    if (value === "unknown") document.getElementById("sharingUnknown").classList.remove("hidden");
  }
  if (q === 3 && !selected("dataType").length) return false;
  if (q === 4 && !selected("samples").length) return false;
  return true;
}

function updateConditionalQuestions() {
  const origin = selected("origin")[0];
  const sharing = selected("sharing")[0];

  document.getElementById("q11").classList.toggle("hidden", selected("sequenced")[0] !== "yes");
  document.getElementById("q2").classList.toggle("hidden", selected("sequenced")[0] !== "yes");

  const external = origin === "someExternal" || origin === "allExternal";
  document.getElementById("q21").classList.toggle("hidden", !external);

  if (sharing === "unknown") document.getElementById("sharingUnknown").classList.remove("hidden");
  if (sharing === "no") document.getElementById("sharingNo").classList.remove("hidden");
}

form.addEventListener("change", () => {
  clearConditionalDisplays();
  updateConditionalQuestions();

  const sequenced = selected("sequenced")[0];
  if (sequenced === "no") {
    document.getElementById("notReady").classList.remove("hidden");
    stopped = true;
    nextBtn.classList.add("hidden");
  } else if (!stopped) {
    nextBtn.classList.remove("hidden");
  }

  if (selected("sharing")[0] === "no") {
    document.getElementById("sharingNo").classList.remove("hidden");
    stopped = true;
    nextBtn.classList.add("hidden");
  } else if (!stopped) {
    nextBtn.classList.remove("hidden");
  }
});

nextBtn.addEventListener("click", () => {
  if (stopped) return;
  if (!validateStep()) {
    if (currentStep === 1 && selected("sequenced")[0] === "no") return;
    if (currentStep === 2.1 && selected("sharing")[0] === "no") return;
    alert("Please answer the current question before continuing.");
    return;
  }

  if (currentStep === 1) showStep(1.1);
  else if (currentStep === 1.1) showStep(2);
  else if (currentStep === 2) {
    if (selected("origin")[0] === "maxima") showStep(3);
    else showStep(2.1);
  } else if (currentStep === 2.1) showStep(3);
  else if (currentStep === 3) showStep(4);
  else if (currentStep === 4) buildResults();
});

backBtn.addEventListener("click", () => {
  if (currentStep === 1.1) showStep(1);
  else if (currentStep === 2) showStep(1.1);
  else if (currentStep === 2.1) showStep(2);
  else if (currentStep === 3) {
    showStep(selected("origin")[0] === "maxima" ? 2 : 2.1);
  } else if (currentStep === 4) showStep(3);
});

function calculateWeeks() {
  let weeks = 0;
  if (selected("sequencing").includes("outsourced")) weeks += 2;
  if (selected("sequencing").includes("singlecell")) weeks += 2;

  const origin = selected("origin")[0];
  if (origin === "someExternal" || origin === "allExternal") weeks += 2;

  if (selected("dataType").includes("methylation")) weeks += 2;

  const samples = selected("samples")[0];
  if (samples === "100to500") weeks += 1;
  if (samples === "500to1000") weeks += 2;
  if (samples === "over1000") weeks += 3;

  return weeks;
}

function buildChecklist() {
  const sequencing = selected("sequencing");
  const origin = selected("origin")[0];
  const dataTypes = selected("dataType");

  const items = [
    {
      show: true,
      text: "Your project and related datasets are already registered in FAIR Wizard, following the relevant registration instructions.",
      condition: "Always required"
    },
    {
      show: !sequencing.includes("diagnostics"),
      text: "Make sure you know the protocol used during the sequencing of your cells. If you don't, ask the sequencing provider how the sequencing was performed and how the samples were treated.",
      condition: "Because your sequencing source is not diagnostics"
    },
    {
      show: origin !== "maxima",
      text: "Make sure you know the provenance of the sample — for example, the sex of the individual who provided the sample, tumor type and topography. Contact the provider in advance.",
      condition: "Because your dataset includes external samples"
    },
    {
      show: origin !== "maxima",
      text: "Make sure identifiers exist for each individual and each relevant class, because the submission data model relies on these identifiers.",
      condition: "Because your dataset includes external samples"
    },
    {
      show: dataTypes.includes("methylation"),
      text: "Prepare the relevant assay information for the methylation data in advance.",
      condition: "Because your dataset includes methylation data"
    }
  ];

  checklistEl.innerHTML = items.filter(i => i.show).map(i => `
    <label class="check-item">
      <input type="checkbox">
      <span>${i.text}<span class="conditional">${i.condition}</span></span>
    </label>
  `).join("");
}

function buildResults() {
  const weeks = calculateWeeks();
  addedWeeksEl.textContent = `${weeks} ${weeks === 1 ? "week" : "weeks"}`;
  totalTimelineEl.textContent = weeks ? `2 months + ${weeks} ${weeks === 1 ? "week" : "weeks"}` : "2 months";
  buildChecklist();
  results.classList.remove("hidden");
  results.scrollIntoView({ behavior: "smooth" });
}

document.getElementById("printBtn").addEventListener("click", () => window.print());

document.getElementById("restartBtn").addEventListener("click", () => {
  form.reset();
  clearConditionalDisplays();
  document.querySelectorAll(".question-card").forEach(s => {
    if (s.dataset.step === "1") s.classList.remove("hidden");
    else if (s.dataset.step === "1.1") s.classList.add("hidden");
    else if (s.dataset.step === "2") s.classList.add("hidden");
    else if (s.dataset.step === "2.1") s.classList.add("hidden");
    else if (s.dataset.step === "3") s.classList.add("hidden");
    else if (s.dataset.step === "4") s.classList.add("hidden");
  });
  stopped = false;
  nextBtn.classList.remove("hidden");
  showStep(1);
  results.classList.add("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
});

updateConditionalQuestions();
updateProgress();
