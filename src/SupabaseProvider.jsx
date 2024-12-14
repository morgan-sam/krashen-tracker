// components/SupabaseProvider.jsx
import { createContext } from "preact";
import { useSupabase } from "../hooks/useSupabase";

export const SupabaseContext = createContext(null);

export function SupabaseProvider({ children }) {
  const supabase = useSupabase();

  // Don't render anything during SSR
  if (!supabase) {
    return null;
  }

  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  );
}
