import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { resolve } from 'path';

const entry = process.env.MCP_VIEW_ENTRY;

if (!entry) {
  throw new Error(
    'MCP_VIEW_ENTRY env variable is required. Use the build script.',
  );
}

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    rollupOptions: {
      input: resolve(__dirname, `src/${entry}/index.html`),
    },
    outDir: 'dist',
    emptyOutDir: false,
  },
});
