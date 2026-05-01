const toastStack = document.getElementById("toast-stack");
const logModal = document.getElementById("log-modal");
const deployModal = document.getElementById("deploy-modal");
const terminalLog = document.getElementById("terminal-log");
const logTitle = document.getElementById("log-title");
const serviceSearch = document.getElementById("service-search");
const alertCount = document.getElementById("alert-count");
const clock = document.getElementById("clock");

const logPool = [
  "[INFO] Starting health check loop",
  "[INFO] Connected to Redis cluster (3 nodes)",
  "[WARN] High GC pressure detected — heap at 78%",
  "[INFO] Incoming request: POST /api/v2/auth/token (12ms)",
  "[INFO] Cache hit ratio: 94.2%",
  "[ERROR] Failed to reach downstream: connection timeout",
  "[INFO] Retrying downstream — attempt 1/3",
  "[WARN] Rate limit threshold at 85% for client_id: cx_9182",
  "[INFO] DB connection pool: 12/20 active",
  "[WARN] Slow query detected (1230ms): SELECT * FROM events WHERE ...",
];

let logTimer = null;

function renderSparklines() {
  document.querySelectorAll(".sparkline").forEach((sparkline) => {
    const values = (sparkline.dataset.series || "")
      .split(",")
      .map((value) => Number(value.trim()))
      .filter((value) => !Number.isNaN(value));

    sparkline.innerHTML = values
      .map((value) => `<span style="height:${value}%"></span>`)
      .join("");
  });
}

function animateCounters() {
  document.querySelectorAll("[data-counter]").forEach((node) => {
    const target = Number(node.getAttribute("data-counter") || "0");
    const decimals = String(target).includes(".") ? 1 : 0;
    let current = 0;
    const increment = Math.max(target / 28, decimals ? 0.1 : 1);

    const tick = () => {
      current += increment;
      if (current >= target) {
        node.textContent = target.toFixed(decimals);
        return;
      }

      node.textContent = current.toFixed(decimals);
      requestAnimationFrame(tick);
    };

    tick();
  });
}

function addToast(message, tone = "info") {
  const item = document.createElement("div");
  item.className = `toast ${tone}`;
  item.innerHTML = `<span>${message}</span><button type="button">×</button>`;

  item.querySelector("button").addEventListener("click", () => {
    item.remove();
  });

  toastStack.appendChild(item);

  window.setTimeout(() => {
    item.remove();
  }, 3200);
}

function updateClock() {
  clock.textContent = `${new Date().toUTCString().slice(5, 22)} UTC`;
}

function updateAlertCount() {
  const openAlerts = document.querySelectorAll(".alert-card[data-alert-open='true']").length;
  alertCount.textContent = String(openAlerts);
}

function showModal(modal) {
  modal.classList.remove("hidden");
}

function hideModal(modal) {
  modal.classList.add("hidden");
}

function startLogStream(target) {
  logTitle.textContent = target;
  terminalLog.innerHTML = "";

  const initialLines = logPool.slice(0, 5);
  initialLines.forEach((line) => {
    const row = document.createElement("div");
    row.textContent = `${new Date().toLocaleTimeString("en-GB")}  ${line}`;
    terminalLog.appendChild(row);
  });

  if (logTimer) {
    clearInterval(logTimer);
  }

  logTimer = window.setInterval(() => {
    const row = document.createElement("div");
    const line = logPool[Math.floor(Math.random() * logPool.length)];
    row.textContent = `${new Date().toLocaleTimeString("en-GB")}  ${line}`;
    terminalLog.appendChild(row);
    terminalLog.scrollTop = terminalLog.scrollHeight;

    while (terminalLog.children.length > 18) {
      terminalLog.removeChild(terminalLog.firstChild);
    }
  }, 1000);
}

function switchView(targetView) {
  document.querySelectorAll(".nav-link").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === targetView);
  });

  document.querySelectorAll("[data-panel]").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.panel === targetView);
  });
}

document.querySelectorAll(".nav-link").forEach((button) => {
  button.addEventListener("click", () => switchView(button.dataset.view));
});

document.querySelectorAll(".open-logs").forEach((button) => {
  button.addEventListener("click", () => {
    startLogStream(button.dataset.target || "Service");
    showModal(logModal);
  });
});

document.querySelectorAll(".close-modal").forEach((button) => {
  button.addEventListener("click", () => {
    const modal = document.getElementById(button.dataset.close);
    if (modal) hideModal(modal);
  });
});

[logModal, deployModal].forEach((modal) => {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      hideModal(modal);
    }
  });
});

document.getElementById("open-deploy").addEventListener("click", () => showModal(deployModal));
document.getElementById("open-pipeline-deploy").addEventListener("click", () => {
  switchView("pipelines");
  showModal(deployModal);
});

document.getElementById("confirm-deploy").addEventListener("click", () => {
  const repo = document.getElementById("deploy-repo").value || "core-api";
  const env = document.getElementById("deploy-environment").value || "staging";
  addToast(`Deployment queued for ${repo} → ${env}`, env === "production" ? "warning" : "success");
  hideModal(deployModal);
});

document.querySelectorAll(".service-restart").forEach((button) => {
  button.addEventListener("click", () => addToast("Service restarted successfully", "success"));
});

document.querySelectorAll(".service-rollback").forEach((button) => {
  button.addEventListener("click", () => addToast("Rollback started for degraded service", "warning"));
});

document.querySelectorAll(".service-scale").forEach((button) => {
  button.addEventListener("click", () => addToast(`Scaling ${button.dataset.serviceName}`, "info"));
});

document.querySelectorAll(".rerun-pipeline").forEach((button) => {
  button.addEventListener("click", () => addToast("Pipeline re-run triggered", "info"));
});

document.querySelectorAll(".cordon-node").forEach((button) => {
  button.addEventListener("click", () => {
    button.textContent = button.textContent === "Cordon" ? "Uncordon" : "Cordon";
    addToast("Node scheduling state updated", "warning");
  });
});

document.querySelectorAll(".describe-node").forEach((button) => {
  button.addEventListener("click", () => addToast("Node description requested", "info"));
});

document.querySelectorAll(".acknowledge-alert").forEach((button) => {
  button.addEventListener("click", () => {
    const card = button.closest(".alert-card");
    card.classList.add("acked");
    card.dataset.alertOpen = "false";
    button.parentElement.remove();
    addToast("Alert acknowledged", "info");
    updateAlertCount();
  });
});

document.querySelectorAll(".dismiss-alert").forEach((button) => {
  button.addEventListener("click", () => {
    const card = button.closest(".alert-card");
    card.classList.add("hidden");
    card.dataset.alertOpen = "false";
    addToast("Alert dismissed", "warning");
    updateAlertCount();
  });
});

document.getElementById("refresh-nodes").addEventListener("click", () => {
  addToast("Cluster state refreshed", "info");
});

serviceSearch.addEventListener("input", () => {
  const query = serviceSearch.value.trim().toLowerCase();
  document.querySelectorAll(".service-row").forEach((row) => {
    const haystack = row.dataset.service || "";
    row.classList.toggle("hidden", query && !haystack.includes(query));
  });
});

renderSparklines();
animateCounters();
updateClock();
updateAlertCount();
window.setInterval(updateClock, 1000);
switchView("overview");
