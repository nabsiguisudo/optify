export type SegmentScope = "user" | "event";

export type SegmentValueType = "text" | "number" | "date" | "select";

export type SegmentOperator =
  | "is"
  | "is_not"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with"
  | "matches_regex"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "between"
  | "exists"
  | "not_exists";

export interface SegmentFilterMeta {
  value: string;
  label: string;
  type: SegmentValueType;
  options?: string[];
}

export interface SegmentCondition {
  id: string;
  kind: "condition";
  scope: SegmentScope;
  attribute: string;
  operator: SegmentOperator;
  value?: string;
  secondValue?: string;
}

export interface SegmentGroup {
  id: string;
  kind: "group";
  combinator: "and" | "or";
  children: Array<SegmentNode>;
}

export type SegmentNode = SegmentCondition | SegmentGroup;

export interface SavedSegmentElement {
  id: string;
  name: string;
  description?: string;
  role?: string;
  targetUrl: string;
  device: "desktop" | "mobile" | "tablet" | "any";
  selector?: string;
  elementText?: string;
  createdAt: string;
}

export interface SegmentDefinition {
  id: string;
  name: string;
  description?: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  userFilters: SegmentGroup;
  eventFilters: SegmentGroup;
}

export const userFilterMetas: SegmentFilterMeta[] = [
  { value: "user_id", label: "User ID", type: "text" },
  { value: "user_name", label: "Nom", type: "text" },
  { value: "user_email", label: "Email", type: "text" },
  { value: "total_active_time", label: "Temps actif total", type: "number" },
  { value: "total_time", label: "Temps total", type: "number" },
  { value: "avg_session_active_time", label: "Temps actif moyen par session", type: "number" },
  { value: "avg_session_length", label: "Durée moyenne de session", type: "number" },
  { value: "first_seen", label: "First seen", type: "date" },
  { value: "last_seen", label: "Last seen", type: "date" },
  { value: "total_sessions", label: "Total sessions", type: "number" },
  { value: "backend_string", label: "Backend string", type: "text" },
  { value: "locale_string", label: "Local string", type: "text" },
  { value: "country", label: "Pays", type: "text" },
  { value: "city", label: "Ville", type: "text" },
  { value: "device_type", label: "Type de device", type: "select", options: ["desktop", "mobile", "tablet"] },
  { value: "browser", label: "Browser", type: "select", options: ["chrome", "safari", "firefox", "edge", "other"] }
];

export const eventFilterMetas: SegmentFilterMeta[] = [
  { value: "visited_page", label: "Page visitée", type: "text" },
  { value: "visited_url", label: "URL visitée", type: "text" },
  { value: "event_type", label: "Type d'événement", type: "select", options: [
    "page_view",
    "click",
    "input_change",
    "view_element",
    "highlight_text",
    "copy",
    "paste",
    "rage_click",
    "error_click",
    "dead_click",
    "refresh_url",
    "pinch_to_zoom",
    "thrash_cursor",
    "abandon_form",
    "console_error",
    "network_error",
    "exception",
    "api_error",
    "suspicious_activity"
  ] },
  { value: "click_text", label: "Clic sur texte", type: "text" },
  { value: "click_selector", label: "Clic sur sélecteur CSS", type: "text" },
  { value: "saved_element", label: "Élément sauvegardé", type: "select" },
  { value: "input_name", label: "Champ input", type: "text" },
  { value: "friction_signal", label: "Signal de friction", type: "select", options: ["rage_click", "error_click", "dead_click", "refresh_url", "pinch_to_zoom", "thrash_cursor", "abandon_form"] },
  { value: "error_type", label: "Erreur", type: "select", options: ["console_error", "network_error", "exception", "api_error"] },
  { value: "dom_content_loaded", label: "DOM content loaded", type: "number" },
  { value: "cls", label: "Cumulative Layout Shift", type: "number" },
  { value: "fid", label: "First Input Delay", type: "number" },
  { value: "inp", label: "Interaction to Next Paint", type: "number" },
  { value: "tti", label: "Time to Interactive", type: "number" },
  { value: "tbt", label: "Total Blocking Time", type: "number" },
  { value: "ttfb", label: "Time to First Byte", type: "number" },
  { value: "fcp", label: "First Contentful Paint", type: "number" },
  { value: "lcp", label: "Largest Contentful Paint", type: "number" },
  { value: "compliance_signal", label: "Compliance", type: "select", options: ["detection_event", "suspicious_activity", "api_error"] }
];

export const textOperators: SegmentOperator[] = ["is", "is_not", "contains", "not_contains", "starts_with", "ends_with", "matches_regex", "exists", "not_exists"];
export const numberOperators: SegmentOperator[] = ["gt", "gte", "lt", "lte", "between", "is", "is_not"];
export const dateOperators: SegmentOperator[] = ["is", "gt", "gte", "lt", "lte", "between", "exists", "not_exists"];

export function createSegmentStorageKey(projectId: string) {
  return `optify.segments.${projectId}`;
}

export function createSegmentElementsStorageKey(projectId: string) {
  return `optify.segment-elements.${projectId}`;
}

export function getSegmentMeta(scope: SegmentScope, attribute: string, savedElements: SavedSegmentElement[] = []) {
  const source = scope === "user" ? userFilterMetas : eventFilterMetas;
  const found = source.find((item) => item.value === attribute) ?? source[0];
  if (scope === "event" && attribute === "saved_element") {
    return {
      ...found,
      options: savedElements.map((element) => element.name)
    };
  }
  return found;
}
