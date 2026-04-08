function required(value: string | undefined, name: string) {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  openAiKey: process.env.OPENAI_API_KEY,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
};

export function hasSupabaseEnv() {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey && env.supabaseServiceRoleKey);
}

export function getSupabaseServerEnv() {
  return {
    url: required(env.supabaseUrl, "NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: required(env.supabaseAnonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    serviceRoleKey: required(env.supabaseServiceRoleKey, "SUPABASE_SERVICE_ROLE_KEY")
  };
}
