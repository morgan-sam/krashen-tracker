// App.jsx
import { hydrate, prerender as ssr } from "preact-iso";
import { useEffect, useState } from "preact/hooks";
import { supabase } from "./supabase";
import "./style.css";
import Calendar from "./Calendar";
import Player from "./Player";
import Auth from "./Auth";

export function App() {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  // Get user email from session
  const userEmail = session.user.email;

  return (
    <div>
      <div className="fixed top-4 right-4 flex items-center gap-4 bg-white p-2 rounded shadow-sm">
        <span className="text-sm">{userEmail}</span>
        <button
          onClick={() => supabase.auth.signOut()}
          className="rounded bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300"
        >
          Sign out
        </button>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Pass userEmail to both components */}
        <Player email={userEmail} />
        <Calendar email={userEmail} />
      </div>
    </div>
  );
}

if (typeof window !== "undefined") {
  hydrate(<App />, document.getElementById("app"));
}

export async function prerender(data) {
  return await ssr(<App {...data} />);
}
