// Yaw constants used by the sensitivity conversion formula.
const VALORANT_YAW = 0.07;
const CS2_YAW = 0.022;

const DIRECTIONS = {
  "valorant-cs2": {
    sourceName: "Valorant",
    targetName: "CS2",
    sourceYaw: VALORANT_YAW,
    targetYaw: CS2_YAW,
    sensPlaceholder: "e.g. 0.35"
  },
  "cs2-valorant": {
    sourceName: "CS2",
    targetName: "Valorant",
    sourceYaw: CS2_YAW,
    targetYaw: VALORANT_YAW,
    sensPlaceholder: "e.g. 1.11"
  }
};

const form = document.querySelector("#calculator-form");
const message = document.querySelector("#message");
const results = document.querySelector("#results");

const sourceSensInput = document.querySelector("#source-sens");
const sourceDpiInput = document.querySelector("#source-dpi");
const targetDpiInput = document.querySelector("#target-dpi");
const directionInputs = document.querySelectorAll('input[name="direction"]');
const presetButtons = document.querySelectorAll(".preset-button");

const sourceSensLabel = document.querySelector("#source-sens-label");
const sourceDpiLabel = document.querySelector("#source-dpi-label");
const targetDpiLabel = document.querySelector("#target-dpi-label");
const targetDpiHint = document.querySelector("#target-dpi-hint");

const targetResultLabel = document.querySelector("#target-result-label");
const targetSensOutput = document.querySelector("#target-sens-result");
const sourceEdpiLabel = document.querySelector("#source-edpi-label");
const targetEdpiLabel = document.querySelector("#target-edpi-label");
const sourceEdpiOutput = document.querySelector("#source-edpi");
const targetEdpiOutput = document.querySelector("#target-edpi");
const sourceCmLabel = document.querySelector("#source-cm-label");
const targetCmLabel = document.querySelector("#target-cm-label");
const sourceCmOutput = document.querySelector("#source-cm");
const targetCmOutput = document.querySelector("#target-cm");
const copyButton = document.querySelector("#copy-result");
const copyStatus = document.querySelector("#copy-status");

let currentSensitivityResult = "";
let copyStatusTimeout = null;

function parsePositiveNumber(value) {
  // Accepts both dot and comma as decimal separators.
  const normalizedValue = value.trim().replace(",", ".");
  const number = Number(normalizedValue);

  if (!normalizedValue || !Number.isFinite(number) || number <= 0) {
    return null;
  }

  return number;
}

function formatNumber(number, fractionDigits) {
  return number.toFixed(fractionDigits);
}

function getSelectedDirection() {
  const selectedInput = document.querySelector('input[name="direction"]:checked');
  return DIRECTIONS[selectedInput.value];
}

function showError(text) {
  message.textContent = text;
  message.className = "message error";
  results.classList.remove("visible");
}

function clearError() {
  message.textContent = "";
  message.className = "message";
}

function clearCopyStatus() {
  copyStatus.textContent = "";
  window.clearTimeout(copyStatusTimeout);
}

function updateLabels() {
  const direction = getSelectedDirection();

  sourceSensLabel.textContent = `${direction.sourceName} sensitivity`;
  sourceDpiLabel.textContent = `${direction.sourceName} DPI`;
  targetDpiLabel.innerHTML = `${direction.targetName} DPI <span class="optional-label">(optional)</span>`;
  targetDpiHint.textContent = `Leave blank if you use the same DPI in ${direction.targetName}.`;
  targetResultLabel.textContent = `Set in ${direction.targetName}:`;
  sourceEdpiLabel.textContent = `eDPI ${direction.sourceName}`;
  targetEdpiLabel.textContent = `eDPI ${direction.targetName}`;
  sourceCmLabel.textContent = direction.sourceName;
  targetCmLabel.textContent = direction.targetName;
  sourceSensInput.placeholder = direction.sensPlaceholder;
  targetDpiInput.placeholder = `Blank = ${direction.sourceName} DPI`;
}

function calculateCmPer360(sensitivity, dpi, yaw) {
  // cm/360 estimates how many centimeters of mouse movement are needed for a full turn.
  return (360 / (sensitivity * dpi * yaw)) * 2.54;
}

function calculateSensitivity(showValidationErrors = true) {
  const direction = getSelectedDirection();
  const sourceSens = parsePositiveNumber(sourceSensInput.value);
  const sourceDpi = parsePositiveNumber(sourceDpiInput.value);
  const rawTargetDpi = targetDpiInput.value.trim();
  const targetDpi = rawTargetDpi ? parsePositiveNumber(rawTargetDpi) : sourceDpi;

  clearError();
  clearCopyStatus();

  if (sourceSens === null || sourceDpi === null || targetDpi === null) {
    if (showValidationErrors) {
      showError("Enter valid sensitivity and DPI values greater than zero.");
    }
    return false;
  }

  // Formula: target_sens = source_sens * source_DPI * source_yaw / (target_DPI * target_yaw)
  const targetSensitivity = (sourceSens * sourceDpi * direction.sourceYaw) / (targetDpi * direction.targetYaw);
  const sourceEdpi = sourceSens * sourceDpi;
  const targetEdpi = targetSensitivity * targetDpi;
  const sourceCm = calculateCmPer360(sourceSens, sourceDpi, direction.sourceYaw);
  const targetCm = calculateCmPer360(targetSensitivity, targetDpi, direction.targetYaw);

  currentSensitivityResult = formatNumber(targetSensitivity, 3);
  targetSensOutput.textContent = currentSensitivityResult;
  sourceEdpiOutput.textContent = formatNumber(sourceEdpi, 3);
  targetEdpiOutput.textContent = formatNumber(targetEdpi, 3);
  sourceCmOutput.textContent = formatNumber(sourceCm, 2);
  targetCmOutput.textContent = formatNumber(targetCm, 2);
  results.classList.add("visible");
  return true;
}

function recalculateIfPossible() {
  if (!calculateSensitivity(false)) {
    clearError();
    results.classList.remove("visible");
  }
}

async function copyResult() {
  if (!currentSensitivityResult) {
    return;
  }

  try {
    await navigator.clipboard.writeText(currentSensitivityResult);
  } catch {
    // Fallback for older browsers.
    const temporaryInput = document.createElement("input");
    temporaryInput.value = currentSensitivityResult;
    document.body.appendChild(temporaryInput);
    temporaryInput.select();
    document.execCommand("copy");
    temporaryInput.remove();
  }

  copyStatus.textContent = "Copied!";
  window.clearTimeout(copyStatusTimeout);
  copyStatusTimeout = window.setTimeout(() => {
    copyStatus.textContent = "";
  }, 2000);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  calculateSensitivity(true);
});

directionInputs.forEach((input) => {
  input.addEventListener("change", () => {
    updateLabels();
    recalculateIfPossible();
  });
});

presetButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const targetInput = button.dataset.target === "source" ? sourceDpiInput : targetDpiInput;
    targetInput.value = button.dataset.dpi;
    targetInput.focus();
    recalculateIfPossible();
  });
});

[sourceSensInput, sourceDpiInput, targetDpiInput].forEach((input) => {
  input.addEventListener("input", () => {
    if (results.classList.contains("visible")) {
      recalculateIfPossible();
    }
  });
});

copyButton.addEventListener("click", copyResult);
updateLabels();
