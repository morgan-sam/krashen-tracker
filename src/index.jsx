import { hydrate, prerender as ssr } from "preact-iso";
import { useEffect, useState } from "preact/hooks";
import { supabase } from "./supabase";
import "./style.css";
import Calendar from "./Calendar";
import Player from "./Player";
import Auth from "./Auth";
import { DarkModeProvider } from "./DarkModeContext";
import { DarkModeToggle } from "./DarkModeToggle";

export function App() {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-xl dark:text-white">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="fixed top-4 right-4 flex items-center gap-4 bg-white dark:bg-gray-800 p-2 rounded shadow-sm">
        <span className="text-sm text-gray-800 dark:text-gray-200">
          {session.user.email}
        </span>
        <DarkModeToggle />
        <button
          onClick={() => supabase.auth.signOut()}
          className="rounded bg-gray-200 dark:bg-gray-700 px-3 py-1 text-sm hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
        >
          Sign out
        </button>
      </div>

      <div className="w-full container mx-auto px-4 py-8 space-y-8">
        <Player email={session.user.email} />
        <Calendar email={session.user.email} />
      </div>
    </div>
  );
}

export function AppContainer() {
  return (
    <DarkModeProvider>
      <App />
    </DarkModeProvider>
  );
}

// Modify hydration to only happen in browser
if (typeof window !== "undefined") {
  hydrate(<AppContainer />, document.getElementById("app"));
}

// Return minimal content for SSR
export async function prerender(data) {
  return ssr(
    <div id="app">
      <div className="w-full min-h-screen flex items-center justify-center bg-white">
        <div className="text-xl">Loading...</div>
      </div>
    </div>
  );
}

//
