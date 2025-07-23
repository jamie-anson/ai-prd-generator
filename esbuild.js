const esbuild = require("esbuild");
const fs = require('fs-extra');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
	name: 'esbuild-problem-matcher',

	setup(build) {
		build.onStart(() => {
			console.log('[watch] build started');
		});
		build.onEnd((result) => {
			result.errors.forEach(({ text, location }) => {
				console.error(`✘ [ERROR] ${text}`);
				console.error(`    ${location.file}:${location.line}:${location.column}:`);
			});
			console.log('[watch] build finished');
		});
	},
};

async function main() {
	// --- Copy static assets ---
	// This ensures that the necessary JS libraries for the graph view are available in the dist folder.
	fs.copySync('node_modules/cytoscape/dist/cytoscape.min.js', 'dist/media/cytoscape.min.js');
	fs.copySync('node_modules/dagre/dist/dagre.min.js', 'dist/media/dagre.min.js');
	fs.copySync('node_modules/cytoscape-dagre/cytoscape-dagre.js', 'dist/media/cytoscape-dagre.js');

	// --- Extension Build --- 
	// This context bundles the main extension file (`extension.ts`) into a single CJS module.
	const extensionCtx = await esbuild.context({
		entryPoints: [
			'src/extension.ts'
		],
		bundle: true,
		format: 'cjs',
		minify: production,
		sourcemap: !production,
		sourcesContent: false,
		platform: 'node',
		outfile: 'dist/extension.js',
		external: ['vscode', 'tree-sitter', 'tree-sitter-typescript'],
		logLevel: 'silent',
		plugins: [
			/* add to the end of plugins array */
			esbuildProblemMatcherPlugin,
		],
	});

	// --- Webview Build ---
	// This context bundles the webview's client-side JavaScript (`main.js`) into a single IIFE file.
	// This allows us to use modern JavaScript modules in our webview code.
	const webviewCtx = await esbuild.context({
		entryPoints: ['src/media/main.js'],
		bundle: true,
		format: 'iife',
		minify: production,
		sourcemap: !production,
		outfile: 'dist/media/main.js',
		logLevel: 'silent',
		plugins: [esbuildProblemMatcherPlugin],
	});

	if (watch) {
		// In watch mode, start watching both contexts for changes.
		await extensionCtx.watch();
		await webviewCtx.watch();
	} else {
		// In a single build, rebuild both contexts and then dispose of them.
		await extensionCtx.rebuild();
		await webviewCtx.rebuild();
		await extensionCtx.dispose();
		await webviewCtx.dispose();
	}
}

main().catch(e => {
	console.error(e);
	process.exit(1);
});
