import { useEffect, useMemo, useState } from "react";

type ServiceStatus = "healthy" | "degraded" | "down";
type StageStatus = "done" | "running" | "failed" | "idle";
type NodeStatus = "ready" | "not-ready";
type AlertSeverity = "critical" | "warning" | "info";
type View = "overview" | "pipelines" | "nodes";

type Service = {
  id: string;
  name: string;
  region: string;
  status: ServiceStatus;
  latency: number | null;
  replicas: number;
  version: string;
};

type Pipeline = {
  id: string;
  name: string;
  repo: string;
  branch: string;
  stages: string[];
  status: StageStatus[];
  duration: string;
  trigger: string;
  commit: string;
};

type Alert = {
  id: number;
  severity: AlertSeverity;
  message: string;
  time: string;
  acknowledged: boolean;
};

type NodeItem = {
  id: string;
  name: string;
  cpu: number;
  memory: number;
  pods: number;
  status: NodeStatus;
  cordoned: boolean;
};

type ToastTone = "success" | "warning" | "danger" | "info";

type Toast = {
  id: number;
  message: string;
  tone: ToastTone;
};

const initialServices: Service[] = [
  { id: "svc-1", name: "API Gateway", region: "us-east-1", status: "healthy", latency: 41, replicas: 4, version: "v3.2.1" },
  { id: "svc-2", name: "Auth Service", region: "us-east-1", status: "healthy", latency: 19, replicas: 3, version: "v2.0.5" },
  { id: "svc-3", name: "Payment Service", region: "eu-west-1", status: "degraded", latency: 318, replicas: 2, version: "v1.9.3" },
  { id: "svc-4", name: "Notifications", region: "us-west-2", status: "healthy", latency: 63, replicas: 2, version: "v4.1.0" },
  { id: "svc-5", name: "Data Pipeline", region: "ap-south-1", status: "healthy", latency: 208, replicas: 5, version: "v2.3.7" },
  { id: "svc-6", name: "ML Inference", region: "us-east-1", status: "down", latency: null, replicas: 0, version: "v1.2.0" },
];

const initialPipelines: Pipeline[] = [
  { id: "pipe-1", name: "main → production", repo: "core-api", branch: "main", stages: ["build", "test", "security", "deploy"], status: ["done", "done", "done", "running"], duration: "3m 42s", trigger: "push", commit: "a3f9c12" },
  { id: "pipe-2", name: "feature/auth-v2", repo: "auth-service", branch: "feature/auth-v2", stages: ["build", "test", "security", "deploy"], status: ["done", "done", "failed", "idle"], duration: "1m 18s", trigger: "pr", commit: "b7e204f" },
  { id: "pipe-3", name: "release/2.4.1", repo: "payment-service", branch: "release/2.4.1", stages: ["build", "test", "security", "deploy"], status: ["done", "done", "done", "done"], duration: "6m 02s", trigger: "tag", commit: "c91a3d7" },
  { id: "pipe-4", name: "hotfix/cache", repo: "cdn-edge", branch: "hotfix/cache", stages: ["build", "test", "security", "deploy"], status: ["running", "idle", "idle", "idle"], duration: "0m 21s", trigger: "push", commit: "d45b8e1" },
];

const initialAlerts: Alert[] = [
  { id: 1, severity: "critical", message: "ml-inference: pod CrashLoopBackOff on worker-07", time: "0m ago", acknowledged: false },
  { id: 2, severity: "warning", message: "payment-service: p99 latency above 300ms for 5 minutes", time: "4m ago", acknowledged: false },
  { id: 3, severity: "info", message: "cdn-edge: cache invalidation completed for 1.2M objects", time: "9m ago", acknowledged: true },
  { id: 4, severity: "warning", message: "data-pipeline: Kafka consumer lag spike on topic events.raw", time: "12m ago", acknowledged: false },
];

const initialNodes: NodeItem[] = [
  { id: "node-1", name: "k8s-master-01", cpu: 34, memory: 61, pods: 12, status: "ready", cordoned: false },
  { id: "node-2", name: "k8s-worker-03", cpu: 78, memory: 82, pods: 31, status: "ready", cordoned: false },
  { id: "node-3", name: "k8s-worker-05", cpu: 45, memory: 55, pods: 24, status: "ready", cordoned: false },
  { id: "node-4", name: "k8s-worker-07", cpu: 91, memory: 94, pods: 28, status: "not-ready", cordoned: false },
  { id: "node-5", name: "k8s-worker-09", cpu: 22, memory: 40, pods: 18, status: "ready", cordoned: false },
];

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

const overviewHighlights = [
  {
    label: "Release lane",
    title: "Prod window open for core-api",
    meta: "2 services staged · 1 deployment running",
    chips: ["deploying", "prod", "3m 42s"],
  },
  {
    label: "Incident focus",
    title: "ML inference recovery playbook active",
    meta: "CrashLoopBackOff isolated to worker-07",
    chips: ["critical", "on-call", "rollback ready"],
  },
  {
    label: "Runner fleet",
    title: "7 of 9 runners available",
    meta: "Queue time stable at 14s average",
    chips: ["healthy", "autoscale", "eu + us"],
  },
];

function useNow() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return now;
}

function useMetricSeries(base: number, variance: number, points = 18) {
  const [series, setSeries] = useState(() =>
    Array.from({ length: points }, (_, index) => ({
      id: index,
      value: Math.max(6, Math.min(96, base + (Math.random() - 0.5) * variance)),
    })),
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setSeries((current) => [
        ...current.slice(1),
        {
          id: current[current.length - 1].id + 1,
          value: Math.max(6, Math.min(96, base + (Math.random() - 0.5) * variance)),
        },
      ]);
    }, 1600);

    return () => clearInterval(timer);
  }, [base, variance]);

  return series;
}

function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const pushToast = (message: string, tone: ToastTone) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3400);
  };

  return { toasts, pushToast, dismissToast: (id: number) => setToasts((current) => current.filter((toast) => toast.id !== id)) };
}

function MetricCard({
  label,
  value,
  unit,
  tone,
  series,
}: {
  label: string;
  value: string;
  unit: string;
  tone: "blue" | "green" | "purple" | "red";
  series: { id: number; value: number }[];
}) {
  return (
    <article className={`metric-card tone-${tone}`}>
      <div className="metric-head">
        <span>{label}</span>
        <strong>
          {value}
          <small>{unit}</small>
        </strong>
      </div>
      <div className="sparkline" aria-hidden="true">
        {series.map((point) => (
          <span key={point.id} style={{ height: `${point.value}%` }} />
        ))}
      </div>
    </article>
  );
}

function ToastStack({
  toasts,
  dismissToast,
}: {
  toasts: Toast[];
  dismissToast: (id: number) => void;
}) {
  return (
    <div className="toast-stack">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast tone-${toast.tone}`}>
          <span>{toast.message}</span>
          <button type="button" onClick={() => dismissToast(toast.id)}>
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

function App() {
  const now = useNow();
  const cpuSeries = useMetricSeries(58, 32);
  const memorySeries = useMetricSeries(69, 16);
  const rpsSeries = useMetricSeries(74, 36);
  const errorSeries = useMetricSeries(18, 12);

  const [activeView, setActiveView] = useState<View>("overview");
  const [services, setServices] = useState<Service[]>(initialServices);
  const [pipelines, setPipelines] = useState<Pipeline[]>(initialPipelines);
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [nodes, setNodes] = useState<NodeItem[]>(initialNodes);
  const [search, setSearch] = useState("");
  const [logTarget, setLogTarget] = useState<string | null>(null);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [deployForm, setDeployForm] = useState({ repo: "core-api", branch: "main", environment: "staging" });
  const [logLines, setLogLines] = useState<string[]>([]);
  const { toasts, pushToast, dismissToast } = useToasts();

  useEffect(() => {
    if (!logTarget) return;

    setLogLines(logPool.slice(0, 5).map((line) => `${new Date().toLocaleTimeString("en-GB")}  ${line}`));

    const timer = setInterval(() => {
      const next = logPool[Math.floor(Math.random() * logPool.length)];
      setLogLines((current) => [...current.slice(-14), `${new Date().toLocaleTimeString("en-GB")}  ${next}`]);
    }, 1000);

    return () => clearInterval(timer);
  }, [logTarget]);

  const filteredServices = useMemo(() => {
    if (!search.trim()) return services;
    const query = search.toLowerCase();
    return services.filter((service) => service.name.toLowerCase().includes(query) || service.region.toLowerCase().includes(query));
  }, [search, services]);

  const healthyCount = services.filter((service) => service.status === "healthy").length;
  const downCount = services.filter((service) => service.status === "down").length;
  const unackedAlerts = alerts.filter((alert) => !alert.acknowledged).length;

  const restartService = (targetId: string) => {
    setServices((current) =>
      current.map((service) =>
        service.id === targetId
          ? {
              ...service,
              status: "healthy",
              latency: Math.floor(Math.random() * 70 + 18),
            }
          : service,
      ),
    );
    pushToast("Service restarted successfully", "success");
  };

  const rollbackService = (targetId: string) => {
    setServices((current) =>
      current.map((service) =>
        service.id === targetId
          ? {
              ...service,
              status: "healthy",
              latency: Math.floor(Math.random() * 50 + 16),
            }
          : service,
      ),
    );
    pushToast("Rollback started for degraded service", "warning");
  };

  const rerunPipeline = (pipelineId: string) => {
    setPipelines((current) =>
      current.map((pipeline) =>
        pipeline.id === pipelineId
          ? {
              ...pipeline,
              status: ["running", "idle", "idle", "idle"],
              duration: "0m 00s",
            }
          : pipeline,
      ),
    );
    pushToast("Pipeline re-run triggered", "info");
  };

  const acknowledgeAlert = (alertId: number) => {
    setAlerts((current) =>
      current.map((alert) => (alert.id === alertId ? { ...alert, acknowledged: true } : alert)),
    );
    pushToast("Alert acknowledged", "info");
  };

  const dismissAlert = (alertId: number) => {
    setAlerts((current) => current.filter((alert) => alert.id !== alertId));
    pushToast("Alert dismissed", "warning");
  };

  const toggleNodeCordon = (nodeId: string) => {
    setNodes((current) =>
      current.map((node) =>
        node.id === nodeId ? { ...node, cordoned: !node.cordoned } : node,
      ),
    );
    pushToast("Node scheduling state updated", "warning");
  };

  const handleDeploy = () => {
    const newPipeline: Pipeline = {
      id: `pipe-${Date.now()}`,
      name: `${deployForm.branch} → ${deployForm.environment}`,
      repo: deployForm.repo,
      branch: deployForm.branch,
      stages: ["build", "test", "security", "deploy"],
      status: ["running", "idle", "idle", "idle"],
      duration: "0m 00s",
      trigger: "manual",
      commit: Math.random().toString(16).slice(2, 9),
    };

    setPipelines((current) => [newPipeline, ...current]);
    setActiveView("pipelines");
    setShowDeployModal(false);
    pushToast(`Deployment queued for ${deployForm.repo}`, deployForm.environment === "production" ? "warning" : "success");
  };

  return (
    <>
      <ToastStack toasts={toasts} dismissToast={dismissToast} />

      {logTarget && (
        <div className="modal-backdrop" onClick={() => setLogTarget(null)}>
          <div className="modal shell-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <div>
                <p className="eyebrow">Live Logs</p>
                <h3>{logTarget}</h3>
              </div>
              <button type="button" className="icon-button" onClick={() => setLogTarget(null)}>
                ×
              </button>
            </div>
            <div className="terminal-log">
              {logLines.map((line, index) => (
                <div key={`${line}-${index}`}>{line}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showDeployModal && (
        <div className="modal-backdrop" onClick={() => setShowDeployModal(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <div>
                <p className="eyebrow">Manual Deployment</p>
                <h3>Trigger a new deployment</h3>
              </div>
              <button type="button" className="icon-button" onClick={() => setShowDeployModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <label>
                Repository
                <input
                  value={deployForm.repo}
                  onChange={(event) => setDeployForm((current) => ({ ...current, repo: event.target.value }))}
                />
              </label>
              <label>
                Branch or tag
                <input
                  value={deployForm.branch}
                  onChange={(event) => setDeployForm((current) => ({ ...current, branch: event.target.value }))}
                />
              </label>
              <label>
                Environment
                <select
                  value={deployForm.environment}
                  onChange={(event) => setDeployForm((current) => ({ ...current, environment: event.target.value }))}
                >
                  <option value="staging">staging</option>
                  <option value="production">production</option>
                </select>
              </label>
              <div className="modal-actions">
                <button type="button" className="ghost-button" onClick={() => setShowDeployModal(false)}>
                  Cancel
                </button>
                <button type="button" className="primary-button" onClick={handleDeploy}>
                  Deploy now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="app-shell">
        <aside className="sidebar">
          <div className="brand-lockup">
            <div className="brand-mark">DC</div>
            <div>
              <p className="eyebrow">DevOps Product</p>
              <h1>Control Center</h1>
            </div>
          </div>

          <nav className="sidebar-nav">
            {([
              ["overview", "Overview"],
              ["pipelines", "Pipelines"],
              ["nodes", "Nodes"],
            ] as Array<[View, string]>).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={activeView === value ? "nav-link active" : "nav-link"}
                onClick={() => setActiveView(value)}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="sidebar-panel">
            <p className="eyebrow">Signals</p>
            <div className="sidebar-stats">
              <span>{healthyCount} healthy</span>
              <span>{downCount} down</span>
              <span>{unackedAlerts} open alerts</span>
            </div>
          </div>
        </aside>

        <main className="main-panel">
          <header className="topbar">
            <div>
              <p className="eyebrow">Operations Console</p>
              <h2>Delivery health across services, pipelines, and cluster nodes.</h2>
            </div>
            <div className="topbar-actions">
              <input
                className="search-input"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search services or regions"
              />
              <div className="signal-pill danger">
                {unackedAlerts} alert{unackedAlerts === 1 ? "" : "s"}
              </div>
              <button type="button" className="primary-button" onClick={() => setShowDeployModal(true)}>
                Deploy
              </button>
              <span className="clock">{now.toUTCString().slice(5, 22)} UTC</span>
            </div>
          </header>

          <section className="metrics-grid">
            <MetricCard label="Cluster CPU" value={cpuSeries[cpuSeries.length - 1].value.toFixed(1)} unit="%" tone="blue" series={cpuSeries} />
            <MetricCard label="Memory" value={memorySeries[memorySeries.length - 1].value.toFixed(1)} unit="%" tone="purple" series={memorySeries} />
            <MetricCard label="Req / sec" value={(rpsSeries[rpsSeries.length - 1].value * 122).toFixed(0)} unit="rps" tone="green" series={rpsSeries} />
            <MetricCard label="Error rate" value={(errorSeries[errorSeries.length - 1].value / 10).toFixed(2)} unit="%" tone="red" series={errorSeries} />
          </section>

          <section className="command-strip">
            {overviewHighlights.map((item) => (
              <article key={item.label} className="command-card">
                <p className="command-label">{item.label}</p>
                <strong>{item.title}</strong>
                <p className="command-meta">{item.meta}</p>
                <div className="command-chips">
                  {item.chips.map((chip) => (
                    <span key={chip} className="status-chip">
                      {chip}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </section>

          {activeView === "overview" && (
            <section className="view-grid">
              <article className="panel panel-large">
                <div className="panel-head">
                  <div>
                    <p className="eyebrow">Service Health</p>
                    <h3>{filteredServices.length} tracked services</h3>
                  </div>
                  <span className="panel-note">Live state simulation</span>
                </div>

                <div className="service-list">
                  {filteredServices.map((service) => (
                    <div key={service.id} className="service-row">
                      <div className="service-main">
                        <span className={`status-dot ${service.status}`} />
                        <div>
                          <strong>{service.name}</strong>
                          <p>
                            {service.region} · {service.version}
                          </p>
                        </div>
                      </div>
                      <div className="service-metrics">
                        <span>{service.latency === null ? "N/A" : `${service.latency}ms`}</span>
                        <span>{service.replicas}× replicas</span>
                      </div>
                      <div className="service-actions">
                        <button type="button" className="ghost-button" onClick={() => setLogTarget(service.name)}>
                          Logs
                        </button>
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={() =>
                            setServices((current) =>
                              current.map((item) =>
                                item.id === service.id
                                  ? { ...item, replicas: Math.max(0, item.replicas + (item.status === "down" ? 2 : 1)), status: "healthy" }
                                  : item,
                              ),
                            )
                          }
                        >
                          Scale
                        </button>
                        <button type="button" className="primary-button subtle" onClick={() => restartService(service.id)}>
                          {service.status === "down" ? "Start" : "Restart"}
                        </button>
                        {service.status === "degraded" && (
                          <button type="button" className="danger-button" onClick={() => rollbackService(service.id)}>
                            Rollback
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="panel">
                <div className="panel-head">
                  <div>
                    <p className="eyebrow">Alert Feed</p>
                    <h3>Prioritized incidents</h3>
                  </div>
                  <span className="panel-note">{unackedAlerts} unacknowledged</span>
                </div>
                <div className="alert-list">
                  {alerts.map((alert) => (
                    <div key={alert.id} className={`alert-card ${alert.severity} ${alert.acknowledged ? "acked" : ""}`}>
                      <div className="alert-top">
                        <span className={`severity-badge ${alert.severity}`}>{alert.severity}</span>
                        <time>{alert.time}</time>
                      </div>
                      <p>{alert.message}</p>
                      {!alert.acknowledged && (
                        <div className="alert-actions">
                          <button type="button" className="ghost-button" onClick={() => acknowledgeAlert(alert.id)}>
                            Acknowledge
                          </button>
                          <button type="button" className="danger-button ghost" onClick={() => dismissAlert(alert.id)}>
                            Dismiss
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </article>
            </section>
          )}

          {activeView === "pipelines" && (
            <section className="panel">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">CI / CD Pipelines</p>
                  <h3>Build, test, security, deploy</h3>
                </div>
                <button type="button" className="primary-button subtle" onClick={() => setShowDeployModal(true)}>
                  New pipeline
                </button>
              </div>

              <div className="pipeline-list">
                {pipelines.map((pipeline) => (
                  <div key={pipeline.id} className="pipeline-row">
                    <div className="pipeline-summary">
                      <strong>{pipeline.name}</strong>
                      <p>
                        {pipeline.repo} · {pipeline.branch} · {pipeline.commit} · {pipeline.duration}
                      </p>
                    </div>
                    <div className="pipeline-stages">
                      {pipeline.stages.map((stage, index) => (
                        <span key={`${pipeline.id}-${stage}`} className={`stage-pill ${pipeline.status[index]}`}>
                          {stage}
                        </span>
                      ))}
                    </div>
                    <div className="pipeline-actions">
                      <button type="button" className="ghost-button" onClick={() => setLogTarget(pipeline.repo)}>
                        Logs
                      </button>
                      <button type="button" className="primary-button subtle" onClick={() => rerunPipeline(pipeline.id)}>
                        Re-run
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeView === "nodes" && (
            <section className="panel">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Kubernetes Nodes</p>
                  <h3>Fleet status and scheduling controls</h3>
                </div>
                <button type="button" className="ghost-button" onClick={() => pushToast("Cluster state refreshed", "info")}>
                  Refresh
                </button>
              </div>

              <div className="node-list">
                {nodes.map((node) => (
                  <div key={node.id} className="node-row">
                    <div className="node-main">
                      <span className={`status-dot ${node.status === "ready" ? "healthy" : "down"}`} />
                      <div>
                        <strong>{node.name}</strong>
                        <p>{node.cordoned ? "cordoned" : node.status}</p>
                      </div>
                    </div>

                    <div className="node-bars">
                      <div>
                        <label>CPU</label>
                        <div className="usage-bar">
                          <span style={{ width: `${node.cpu}%` }} className={node.cpu > 85 ? "danger-fill" : node.cpu > 65 ? "warning-fill" : "healthy-fill"} />
                        </div>
                      </div>
                      <div>
                        <label>Memory</label>
                        <div className="usage-bar">
                          <span style={{ width: `${node.memory}%` }} className={node.memory > 85 ? "danger-fill" : node.memory > 65 ? "warning-fill" : "purple-fill"} />
                        </div>
                      </div>
                    </div>

                    <div className="node-meta">
                      <span>{node.pods} pods</span>
                      <span>{node.cpu}% cpu</span>
                    </div>

                    <div className="node-actions">
                      <button type="button" className="ghost-button" onClick={() => toggleNodeCordon(node.id)}>
                        {node.cordoned ? "Uncordon" : "Cordon"}
                      </button>
                      <button type="button" className="ghost-button" onClick={() => pushToast(`Describe ${node.name}`, "info")}>
                        Describe
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </>
  );
}

export default App;
