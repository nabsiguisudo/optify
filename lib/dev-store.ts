import { randomUUID } from "crypto";
import { mkdir, readFile, rename, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { demoUser } from "@/lib/demo-data";
import type {
  AudienceRule,
  EventRecord,
  Experiment,
  ExperimentTargetingGroup,
  Platform,
  PopupConfig,
  Project,
  RecommendationConfig,
  SdkHealthReport,
  Variant,
  VariantChange,
  EventType,
  ExperimentStatus,
  WorkflowState,
  EditorMode,
  ExperimentType,
  LaunchAuditEntry,
  ShopifyConnection,
  SessionRecordingChunk
} from "@/lib/types";

interface DevShopifyConnection extends ShopifyConnection {
  adminAccessToken?: string;
}

export interface DevStore {
  users: Array<{ id: string; email: string; fullName: string }>;
  projects: Project[];
  experiments: Experiment[];
  events: EventRecord[];
  sdkHealth: SdkHealthReport[];
  launchAudit: LaunchAuditEntry[];
  shopifyConnections: DevShopifyConnection[];
  recordings: SessionRecordingChunk[];
}

const storeBaseDir = process.env.VERCEL ? path.join(os.tmpdir(), "optify") : path.join(process.cwd(), ".optify");
const storeDir = storeBaseDir;
const storePath = path.join(storeDir, "dev-store.json");
const tempStorePath = path.join(storeDir, "dev-store.tmp.json");
let storeMutationQueue = Promise.resolve();

function createSeedStore(): DevStore {
  return {
    users: [demoUser],
    projects: [],
    experiments: [],
    events: [],
    sdkHealth: [],
    launchAudit: [],
    shopifyConnections: [],
    recordings: []
  };
}

function normalizeDevStore(value: unknown): DevStore | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<DevStore>;
  if (!Array.isArray(candidate.users) || !Array.isArray(candidate.projects)) {
    return null;
  }

  return {
    users: candidate.users,
    projects: candidate.projects,
    experiments: Array.isArray(candidate.experiments) ? candidate.experiments : [],
    events: Array.isArray(candidate.events) ? candidate.events : [],
    sdkHealth: Array.isArray(candidate.sdkHealth) ? candidate.sdkHealth : [],
    launchAudit: Array.isArray(candidate.launchAudit) ? candidate.launchAudit : [],
    shopifyConnections: Array.isArray((candidate as Partial<DevStore>).shopifyConnections) ? (candidate as Partial<DevStore>).shopifyConnections as DevShopifyConnection[] : [],
    recordings: Array.isArray((candidate as Partial<DevStore>).recordings) ? (candidate as Partial<DevStore>).recordings as SessionRecordingChunk[] : []
  };
}

function isDevStore(value: unknown): value is DevStore {
  return normalizeDevStore(value) !== null;
}

async function writeStoreAtomically(store: DevStore) {
  await mkdir(storeDir, { recursive: true });
  const payload = JSON.stringify(store, null, 2);
  await writeFile(tempStorePath, payload, "utf8");
  await rename(tempStorePath, storePath);
}

async function ensureStore() {
  await mkdir(storeDir, { recursive: true });
  try {
    const raw = await readFile(storePath, "utf8");
    if (!raw.trim()) {
      await writeStoreAtomically(createSeedStore());
      return;
    }

    const parsed = JSON.parse(raw) as unknown;
    const normalized = normalizeDevStore(parsed);
    if (!normalized) {
      await writeStoreAtomically(createSeedStore());
    } else if (
      !Array.isArray((parsed as Partial<DevStore>).experiments)
      || !Array.isArray((parsed as Partial<DevStore>).events)
      || !Array.isArray((parsed as Partial<DevStore>).sdkHealth)
      || !Array.isArray((parsed as Partial<DevStore>).launchAudit)
      || !Array.isArray((parsed as Partial<DevStore>).shopifyConnections)
      || !Array.isArray((parsed as Partial<DevStore>).recordings)
    ) {
      await writeStoreAtomically(normalized);
    }
  } catch {
    await writeStoreAtomically(createSeedStore());
  }
}

export async function readDevStore(): Promise<DevStore> {
  await ensureStore();
  try {
    const raw = await readFile(storePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    const normalized = normalizeDevStore(parsed);
    if (!normalized) {
      throw new Error("Invalid dev store shape");
    }
    return normalized;
  } catch {
    const fallback = createSeedStore();
    await writeStoreAtomically(fallback);
    return fallback;
  }
}

export async function writeDevStore(store: DevStore) {
  await writeStoreAtomically(store);
}

async function mutateDevStore<T>(mutator: (store: DevStore) => T | Promise<T>): Promise<T> {
  const run = storeMutationQueue.then(async () => {
    const store = await readDevStore();
    const result = await mutator(store);
    await writeStoreAtomically(store);
    return result;
  });

  storeMutationQueue = run.then(() => undefined, () => undefined);
  return run;
}

export async function resetDevStore() {
  await writeDevStore(createSeedStore());
}

export async function createDevProject(input: { ownerId: string; name: string; domain: string; platform: Platform }) {
  return mutateDevStore(async (store) => {
    const project: Project = {
      id: randomUUID(),
      name: input.name,
      domain: input.domain,
      platform: input.platform,
      publicKey: `pub_${randomUUID().slice(0, 12)}`,
      workspaceId: input.ownerId,
      scriptUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/optify-sdk.js`
    };

    store.projects.unshift(project);
    return project;
  });
}

function buildVariant({
  experimentId,
  index,
  allocation,
  isControl,
  selector,
  text,
  style
}: {
  experimentId: string;
  index: number;
  allocation: number;
  isControl: boolean;
  selector: string;
  text?: string;
  style?: string;
}): Variant {
  const key = String.fromCharCode(65 + index);
  const changes: VariantChange[] = [];

  if (!isControl && text) {
    changes.push({
      selector,
      type: "text",
      value: text
    });
  }

  if (!isControl && style) {
    changes.push({
      selector,
      type: "style",
      value: style
    });
  }

  return {
    id: randomUUID(),
    experimentId,
    name: isControl ? "Control" : `Variant ${key}`,
    key,
    allocation,
    isControl,
    changes
  };
}

export async function createDevExperiment(input: {
  projectId: string;
  name: string;
  pagePattern: string;
  hypothesis: string;
  type: ExperimentType;
  primaryMetric: EventType;
  status: ExperimentStatus;
  selector: string;
  trafficSplit: number;
  variantInputs: Array<{ text?: string; style?: string }>;
  editorMode: EditorMode;
  customCode?: string;
  audienceRules?: AudienceRule[];
  targeting?: ExperimentTargetingGroup;
  popupConfig?: PopupConfig;
  recommendationConfig?: RecommendationConfig;
  priority?: Experiment["priority"];
  exclusionGroup?: string;
}) {
  return mutateDevStore(async (store) => {
    const experimentId = randomUUID();
    const totalVariants = 1 + input.variantInputs.filter((item) => item.text || item.style).length;
    const baseAllocation = Math.floor(100 / totalVariants);
    const remainder = 100 - baseAllocation * totalVariants;

    const variants = [
      buildVariant({
        experimentId,
        index: 0,
        allocation: baseAllocation + remainder,
        isControl: true,
        selector: input.selector
      }),
      ...input.variantInputs.filter((item) => item.text || item.style).map((variantInput, index) =>
        buildVariant({
          experimentId,
          index: index + 1,
          allocation: baseAllocation,
          isControl: false,
          selector: input.selector,
          text: variantInput.text,
          style: variantInput.style
        })
      )
    ];

    const experiment: Experiment = {
      id: experimentId,
      projectId: input.projectId,
      name: input.name,
      hypothesis: input.hypothesis,
      pagePattern: input.pagePattern,
      trafficSplit: input.trafficSplit,
      status: input.status,
      workflowState: input.status === "running" ? "running" : input.status === "paused" ? "paused" : "draft",
      priority: input.priority ?? "medium",
      exclusionGroup: input.exclusionGroup,
      type: input.type,
      primaryMetric: input.primaryMetric,
      createdAt: new Date().toISOString(),
      editorMode: input.editorMode,
      customCode: input.customCode,
      audienceRules: input.audienceRules ?? [],
      targeting: input.targeting,
      popupConfig: input.popupConfig,
      recommendationConfig: input.recommendationConfig,
      variants
    };

    store.experiments.unshift(experiment);
    return experiment;
  });
}

export async function updateDevExperimentWorkflow(input: {
  experimentId: string;
  workflowState: WorkflowState;
  scheduledFor?: string;
  priority?: Experiment["priority"];
  exclusionGroup?: string;
  note?: string;
  actor?: string;
}) {
  return mutateDevStore(async (store) => {
    const experiment = store.experiments.find((item) => item.id === input.experimentId);
    if (!experiment) {
      throw new Error("Experiment not found");
    }

    experiment.workflowState = input.workflowState;
    experiment.scheduledFor = input.scheduledFor;
    if (input.priority) {
      experiment.priority = input.priority;
    }
    if (typeof input.exclusionGroup === "string") {
      experiment.exclusionGroup = input.exclusionGroup;
    }
    experiment.status =
      input.workflowState === "running"
        ? "running"
        : input.workflowState === "paused"
          ? "paused"
          : "draft";

    store.launchAudit.unshift({
      id: randomUUID(),
      itemId: experiment.id,
      action: input.workflowState,
      timestamp: new Date().toISOString(),
      note: input.note ?? `${experiment.name} moved to ${input.workflowState.replaceAll("_", " ")}`,
      actor: input.actor ?? "workspace"
    });
    store.launchAudit = store.launchAudit.slice(0, 100);

    return experiment;
  });
}

export async function insertDevEvent(event: Omit<EventRecord, "id" | "timestamp">) {
  return mutateDevStore(async (store) => {
    if (event.clientEventId) {
      const existing = store.events.find((item) => item.clientEventId === event.clientEventId);
      if (existing) {
        return existing;
      }
    }
    const record: EventRecord = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      ...event
    };

    store.events.push(record);
    return record;
  });
}

export async function insertSdkHealthReport(report: Omit<SdkHealthReport, "id" | "loadedAt">) {
  return mutateDevStore(async (store) => {
    const record: SdkHealthReport = {
      id: randomUUID(),
      loadedAt: new Date().toISOString(),
      ...report
    };

    store.sdkHealth.unshift(record);
    store.sdkHealth = store.sdkHealth.slice(0, 100);
    return record;
  });
}

export async function insertRecordingChunk(chunk: Omit<SessionRecordingChunk, "id">) {
  return mutateDevStore(async (store) => {
    const existing = store.recordings.find((item) =>
      item.projectId === chunk.projectId
      && item.sessionId === chunk.sessionId
      && item.chunkIndex === chunk.chunkIndex
    );
    if (existing) {
      return existing;
    }

    const record: SessionRecordingChunk = {
      id: randomUUID(),
      ...chunk
    };

    store.recordings.push(record);
    store.recordings = store.recordings
      .sort((a, b) => a.startedAt.localeCompare(b.startedAt))
      .slice(-400);
    return record;
  });
}

export async function appendLaunchAuditEntry(entry: Omit<LaunchAuditEntry, "id" | "timestamp">) {
  return mutateDevStore(async (store) => {
    const record: LaunchAuditEntry = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      ...entry
    };

    store.launchAudit.unshift(record);
    store.launchAudit = store.launchAudit.slice(0, 100);
    return record;
  });
}

export async function upsertShopifyConnection(connection: DevShopifyConnection) {
  return mutateDevStore(async (store) => {
    const index = store.shopifyConnections.findIndex((item) => item.projectId === connection.projectId);
    if (index >= 0) {
      store.shopifyConnections[index] = connection;
    } else {
      store.shopifyConnections.unshift(connection);
    }
    return connection;
  });
}

export async function deleteDevProject(projectId: string) {
  await mutateDevStore(async (store) => {
    store.projects = store.projects.filter((project) => project.id !== projectId);
    store.experiments = store.experiments.filter((experiment) => experiment.projectId !== projectId);
    store.events = store.events.filter((event) => event.projectId !== projectId);
    store.sdkHealth = store.sdkHealth.filter((report) => report.projectId !== projectId);
    store.shopifyConnections = store.shopifyConnections.filter((connection) => connection.projectId !== projectId);
    store.recordings = store.recordings.filter((recording) => recording.projectId !== projectId);

    const remainingExperimentIds = new Set(store.experiments.map((experiment) => experiment.id));
    store.launchAudit = store.launchAudit.filter((entry) => remainingExperimentIds.has(entry.itemId));
  });
}
