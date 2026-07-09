/* VAKIL ADALAT — Config
   Fill these in to turn on live online play (see README.md, "Turning on Play Online").
   Everything else in the game works with these left blank.
*/
const SUPABASE_CONFIG = {
  url: "https://qycghkeymmjxprpnemmn.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5Y2doa2V5bW1qeHBycG5lbW1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0MTI5NjYsImV4cCI6MjA5ODk4ODk2Nn0.uRa7wINPPQewsFvTfUrutaZl8TSPL5rEvjIaLQGG7W0",
};

const ONLINE_ENABLED = !!(SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey);

// Optional: once you deploy supabase/functions/generate-cases (see supabase/README.md),
// put its URL here to pull live AI-generated cases into rotation automatically.
// Leave blank and the game just uses the 24 built-in cases — nothing else changes.
const CASE_GENERATOR_URL = "https://qycghkeymmjxprpnemmn.supabase.co/functions/v1/generate-cases";