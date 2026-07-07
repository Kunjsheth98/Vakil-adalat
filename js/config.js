/* VAKIL ADALAT — Config
   Fill these in to turn on live online play (see README.md, "Turning on Play Online").
   Everything else in the game works with these left blank.
*/
const SUPABASE_CONFIG = {
  url: "https://qycghkeymmjxprpnemmn.supabase.co/rest/v1/",      // e.g. "https://qycghkeymmjxprpnemmn.supabase.co/rest/v1/"
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5Y2doa2V5bW1qeHBycG5lbW1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0MTI5NjYsImV4cCI6MjA5ODk4ODk2Nn0.uRa7wINPPQewsFvTfUrutaZl8TSPL5rEvjIaLQGG7W0",  // your project's public anon key
};

const ONLINE_ENABLED = !!(SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey);
