import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // Tell Vue to treat all agent-* tags as custom elements
          isCustomElement: (tag) => tag.startsWith('agent-'),
        },
      },
    }),
  ],
});
