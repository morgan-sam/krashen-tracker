import { hydrate, prerender as ssr } from "preact-iso";
import { useEffect, useState } from "preact/hooks";
import { testConnection } from "./supabase"; // Import your Supabase functions

import "./style.css";
import Calendar from "./Calendar";
import Player from "./Player";

export function App() {
  const [isConnected, setIsConnected] = useState(null);

  useEffect(() => {
    // Test Supabase connection when component mounts
    const checkConnection = async () => {
      const connected = await testConnection();
      setIsConnected(connected);
    };

    checkConnection();
  }, []);

  return (
    <div>
      {/* Connection status indicator */}
      <div
        style={{
          position: "fixed",
          top: "1rem",
          right: "1rem",
          padding: "0.5rem",
        }}
      >
        {isConnected === null && "Checking connection..."}
        {isConnected === true && "✅ Connected to Supabase"}
        {isConnected === false && "❌ Connection failed"}
      </div>

      <Player />
      <Calendar />
    </div>
  );
}

if (typeof window !== "undefined") {
  hydrate(<App />, document.getElementById("app"));
}

export async function prerender(data) {
  return await ssr(<App {...data} />);
}
