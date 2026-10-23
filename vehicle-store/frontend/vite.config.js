import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({ mode }) => {
  const target = loadEnv(mode, process.cwd(), '').VITE_PROXY_TARGET || 'http://localhost:5000';
  const proxy = { '/api': { target, changeOrigin: true } };
  return { plugins: [react()], server: { host: '0.0.0.0', port: 5173, proxy }, preview: { host: '0.0.0.0', port: 5173, proxy } };
});
