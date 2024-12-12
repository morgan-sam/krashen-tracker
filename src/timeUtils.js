import { supabase } from "./supabase";

export async function updateTimeLog(email, seconds) {
  if (!email || seconds <= 0) return;

  const today = new Date().toISOString().split("T")[0];
  console.log(`Updating time log: ${seconds} seconds for ${email} on ${today}`);

  try {
    // First check if there's an existing record for today
    const { data: existingLog } = await supabase
      .from("time_logs")
      .select("total_seconds")
      .eq("email", email)
      .eq("date", today)
      .single();

    if (existingLog) {
      // Update existing record
      const { data, error } = await supabase
        .from("time_logs")
        .update({
          total_seconds: existingLog.total_seconds + seconds,
          last_updated: new Date().toISOString(),
        })
        .eq("email", email)
        .eq("date", today)
        .select();

      if (error) throw error;
      console.log("Updated existing record:", data);
      return data;
    } else {
      // Insert new record
      const { data, error } = await supabase
        .from("time_logs")
        .insert([
          {
            email,
            date: today,
            total_seconds: seconds,
          },
        ])
        .select();

      if (error) throw error;
      console.log("Created new record:", data);
      return data;
    }
  } catch (error) {
    console.error("Error updating time log:", error);
    throw error;
  }
}
