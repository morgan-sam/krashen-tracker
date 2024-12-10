import { createClient } from "@supabase/supabase-js";

// Enhanced environment variable checking
const checkEnvVariables = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error("VITE_SUPABASE_URL is not defined");
  }
  if (!supabaseKey) {
    throw new Error("VITE_SUPABASE_ANON_KEY is not defined");
  }

  return { supabaseUrl, supabaseKey };
};

export const initializeSupabase = () => {
  try {
    const { supabaseUrl, supabaseKey } = checkEnvVariables();
    console.log("Creating Supabase client...");
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log("Supabase client created successfully");
    return supabase;
  } catch (error) {
    console.error("Failed to initialize Supabase:", error.message);
    throw error;
  }
};

export const testConnection = async () => {
  try {
    console.log("Starting connection test...");
    const supabase = initializeSupabase();

    console.log("Testing query...");
    // First, let's try to get the list of tables
    const { data: tables, error: tablesError } = await supabase
      .from("_tables")
      .select("*")
      .limit(1);

    if (tablesError) {
      console.error("Error getting tables:", tablesError);
      // Try a simple health check instead
      const { error: healthError } = await supabase.auth.getSession();
      if (healthError) {
        throw healthError;
      }
    }

    console.log("Connection test completed successfully!");
    return true;
  } catch (error) {
    console.error("Connection test failed with error:", error.message);
    console.error("Full error:", error);
    return false;
  }
};
