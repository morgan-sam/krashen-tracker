// DarkModeContext.jsx
import { createContext } from "preact";
import { useState, useEffect, useContext } from "preact/hooks";
import { supabase } from "./supabase";

const DarkModeContext = createContext();

export function DarkModeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Get the current user's dark mode preference
    const fetchDarkMode = async () => {
      const session = await supabase.auth.getSession();
      if (session?.data?.session?.user?.email) {
        const { data, error } = await supabase
          .from("users")
          .select("dark_mode")
          .eq("email", session.data.session.user.email)
          .single();

        if (!error && data) {
          setDarkMode(data.dark_mode);
        }
      }
      setLoading(false);
    };

    fetchDarkMode();
  }, []);

  const toggleDarkMode = async () => {
    const session = await supabase.auth.getSession();
    if (session?.data?.session?.user?.email) {
      const newDarkMode = !darkMode;

      const { error } = await supabase
        .from("users")
        .update({ dark_mode: newDarkMode })
        .eq("email", session.data.session.user.email);

      if (!error) {
        setDarkMode(newDarkMode);
      }
    }
  };

  // Apply dark mode class to html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <DarkModeContext.Provider value={{ darkMode, toggleDarkMode, loading }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function useDarkMode() {
  const context = useContext(DarkModeContext);
  if (context === undefined) {
    throw new Error("useDarkMode must be used within a DarkModeProvider");
  }
  return context;
}
