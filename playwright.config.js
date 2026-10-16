import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./test/browser",
  timeout: 120000,
  use: { baseURL: "http://127.0.0.1:5237", headless: true },
  webServer: {
    command: "PORT=5237 npm start",
    url: "http://127.0.0.1:5237",
    reuseExistingServer: false,
  },
  reporter: [["list"], ["html", { open: "never" }]],
});
