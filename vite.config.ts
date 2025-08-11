import { viteCommonjs } from '@originjs/vite-plugin-commonjs';
import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

const host = process.env.TAURI_DEV_HOST;

export default defineConfig(async () => ({
	plugins: [viteCommonjs(), tailwindcss(), solid()],

	clearScreen: false,

	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
			b: path.resolve(__dirname, './backend'),
			debug: 'debug/src/browser.js',
		},
	},

	optimizeDeps: {
		include: ['solid-markdown', 'remark-math', 'rehype-katex'],
	},

	server: {
		port: 1234,
		strictPort: true,
		host: host || false,
		hmr: host
			? {
					protocol: 'ws',
					host,
					port: 1421,
			  }
			: undefined,
		watch: {
			ignored: [
				'**/src-tauri/**',
				'**/node_modules/**',
			],
		},
	},
}));
