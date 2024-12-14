import { defineConfig, loadEnv } from "vite";
import preact from "@preact/preset-vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      preact({
        prerender: {
          enabled: true,
          renderTarget: "#app",
        },
      }),
    ],
    base: "/krashen-tracker/",
    define: {
      // For production build, embed env variables
      ...(mode === "production" && {
        "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
          process.env.VITE_SUPABASE_URL
        ),
        "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(
          process.env.VITE_SUPABASE_ANON_KEY
        ),
      }),
    },
  };
});
