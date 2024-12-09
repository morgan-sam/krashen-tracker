import { hydrate, prerender as ssr } from "preact-iso";

import "./style.css";
import Calendar from "./Calendar";
import Player from "./Player";

export function App() {
  return (
    <div>
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
