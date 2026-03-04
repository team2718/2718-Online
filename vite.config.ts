import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        allowedHosts: ['2718.online', 'localhost'],
        host: '127.0.0.1',
        port: 2723,
        strictPort: true,
    },
    preview: {
        allowedHosts: ['2718.online', 'localhost'],
        host: '127.0.0.1',
        port: 2723,
        strictPort: true,
    },
    plugins: [tailwindcss(), sveltekit()],
    ssr: {
		external: ['@libsql/client']
	}
});
