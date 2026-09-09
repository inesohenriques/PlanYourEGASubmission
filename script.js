const form = document.getElementById("questionnaire");
const result = document.getElementById("result");
const progressBar = document.getElementById("progressBar");
const hoursEl = document.getElementById("hours");
const daysEl = document.getElementById("days");
const breakdownEl = document.getElementById("breakdown");
const resetBtn = document.getElementById("reset");

const scores = {
  size: { small: 5, medium: 15, large: 30 },
  pages: { small: 2, medium: 8, large: 18 },
  auth: { no: 0, yes: 10 },
  design: { basic: 3, custom: 8, high: 15 },
  integrations: { none: 0, some: 8, many: 20 }
};

const labels = {
  size: { small: "Small project", medium: "Medium project", large: "Large project" },
  pages: { small: "1–3 pages/features", medium: "4–10 pages/features", large: "10+ pages/features" },
  auth: { no: "No authentication", yes: "Authentication" },
  design: { basic: "Basic design", custom: "Custom design", high: "Highly customized design" },
  integrations: { none: "No integrations", some: "1–2 integrations", many: "Several integrations" }
};

function updateProgress() {
  const groups = ["size", "pages", "auth", "design", "integrations"];
  const answered = groups.filter(name => form.querySelector(`input[name="${name}"]:checked`)).length;
  progressBar.style.width = `${answered / groups.length * 100}%`;
}

form.addEventListener("change", updateProgress);

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const data = new FormData(form);
  let total = 0;
  const items = [];

  for (const key of Object.keys(scores)) {
    const value = data.get(key);
    const points = scores[key][value];
    total += points;
    items.push(`<div><strong>${labels[key][value]}</strong> — ${points} hours</div>`);
  }

  // Add a 15% planning/uncertainty buffer and round to whole hours.
  const low = Math.max(1, Math.round(total * 1.0));
  const high = Math.max(low + 1, Math.round(total * 1.15));
  const lowDays = Math.ceil(low / 8);
  const highDays = Math.ceil(high / 8);

  hoursEl.textContent = `${low}–${high} hours`;
  daysEl.textContent = `Approximately ${lowDays}–${highDays} working day${highDays === 1 ? "" : "s"} (8 hours/day).`;
  breakdownEl.innerHTML = `<strong>Estimate breakdown</strong>${items.join("")}`;

  form.classList.add("hidden");
  result.classList.remove("hidden");
  progressBar.style.width = "100%";
});

resetBtn.addEventListener("click", () => {
  form.reset();
  result.classList.add("hidden");
  form.classList.remove("hidden");
  progressBar.style.width = "0%";
});
