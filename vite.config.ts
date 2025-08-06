import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs'; 

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

	// We can now simplify this. The plugin is more reliable.
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
				'**/models/**',
				'**/notes/**',
				'**/backend/**',
				'**/node_modules/**',
				'src-tauri/chroma_db/chroma.sqlite3', // Ignore changes to this file
			],
		},
	},
}));