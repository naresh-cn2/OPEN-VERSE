import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "vercel-redirects-local-dev",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const redirects: Record<string, string> = {
            "/api/download/windows": "https://github.com/naresh-cn2/OPEN-VERSE/releases/download/v0.2.6/OPEN-VERSE_0.2.6_x64-setup.exe",
            "/api/download/windows-zip": "https://github.com/naresh-cn2/OPEN-VERSE/releases/download/v0.2.6/OPEN-VERSE_0.2.6_x64-windows.zip",
            "/api/download/android": "/open-verse-mobile.apk",
            "/api/download/android-apk": "https://github.com/naresh-cn2/OPEN-VERSE/releases/download/v0.2.6/open-verse-v0.2.6-android.apk",
            "/api/download/android-zip": "https://github.com/naresh-cn2/OPEN-VERSE/releases/download/v0.2.6/open-verse-mobile-v0.2.6.zip",
            "/api/download/mac": "https://github.com/naresh-cn2/OPEN-VERSE/releases/download/desktop-latest/OPEN-VERSE_0.2.0_aarch64.dmg",
            "/api/download/linux-deb": "https://github.com/naresh-cn2/OPEN-VERSE/releases/download/desktop-latest/OPEN-VERSE_0.2.0_amd64.deb",
            "/api/download/linux-rpm": "https://github.com/naresh-cn2/OPEN-VERSE/releases/download/desktop-latest/OPEN-VERSE-0.2.0-1.x86_64.rpm"
          };
          const target = redirects[req.url?.split("?")[0] || ""];
          if (target) {
            res.writeHead(307, { Location: target });
            res.end();
            return;
          }
          next();
        });
      }
    }
  ],
  server: {
    port: 3300,
    host: "0.0.0.0"
  }
});
