import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { readFile } from "fs/promises";
import path from "path";

function parseEnv(contents) {
  return Object.fromEntries(
    contents
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const [key, ...rest] = line.split("=");
        return [key, rest.join("=").replace(/^['"]|['"]$/g, "")];
      })
  );
}

async function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  const contents = await readFile(envPath, "utf8");
  const parsed = parseEnv(contents);
  return { ...parsed, ...process.env };
}

const env = await loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const seedUserEmail = "founder@optify.ai";
const seedPassword = "OptifyDemo123!";

const listed = await supabase.auth.admin.listUsers();
let user = listed.data.users.find((entry) => entry.email === seedUserEmail);

if (!user) {
  const created = await supabase.auth.admin.createUser({
    email: seedUserEmail,
    password: seedPassword,
    email_confirm: true,
    user_metadata: { full_name: "Optify Demo" }
  });
  if (created.error) {
    throw created.error;
  }
  user = created.data.user;
}

await supabase.from("users").upsert({
  id: user.id,
  email: seedUserEmail,
  full_name: "Optify Demo"
});

const projectId = "11111111-1111-4111-8111-111111111111";
const experimentId = "22222222-2222-4222-8222-222222222222";

await supabase.from("projects").upsert({
  id: projectId,
  owner_id: user.id,
  workspace_id: user.id,
  name: "Northstar Store",
  domain: "northstar-store.com",
  platform: "shopify",
  public_key: "pub_seed_northstar"
});

await supabase.from("experiments").upsert({
  id: experimentId,
  project_id: projectId,
  name: "Hero CTA urgency",
  hypothesis: "A clearer urgency-driven CTA will improve primary conversions on product pages.",
  page_pattern: "/products/*",
  traffic_split: 100,
  status: "running",
  primary_metric: "conversion"
});

await supabase.from("variants").upsert([
  {
    id: "33333333-3333-4333-8333-333333333333",
    experiment_id: experimentId,
    name: "Control",
    key: "A",
    allocation: 50,
    is_control: true,
    changes: []
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    experiment_id: experimentId,
    name: "Urgency CTA",
    key: "B",
    allocation: 50,
    is_control: false,
    changes: [
      {
        selector: "[data-optify='hero-cta']",
        type: "text",
        value: "Get yours before tonight's sell-out"
      }
    ]
  }
]);

await supabase.from("events").delete().eq("experiment_id", experimentId);

const now = new Date();
const events = Array.from({ length: 40 }, (_, index) => ({
  id: randomUUID(),
  project_id: projectId,
  anonymous_id: `seed_visitor_${index}`,
  experiment_id: experimentId,
  variant_key: index % 2 === 0 ? "A" : "B",
  event_type: "page_view",
  pathname: "/products/demo",
  created_at: now.toISOString()
}));

const conversions = Array.from({ length: 9 }, (_, index) => ({
  id: randomUUID(),
  project_id: projectId,
  anonymous_id: `seed_conversion_${index}`,
  experiment_id: experimentId,
  variant_key: index < 3 ? "A" : "B",
  event_type: "conversion",
  pathname: "/products/demo",
  created_at: now.toISOString()
}));

await supabase.from("events").insert([...events, ...conversions]);

console.log("Supabase seeded.");
console.log(`Login: ${seedUserEmail}`);
console.log(`Password: ${seedPassword}`);
console.log(`Project ID: ${projectId}`);
