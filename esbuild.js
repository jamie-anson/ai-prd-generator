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
  fs.copySync('node_modules/cytoscape/dist/cytoscape.min.js', 'dist/media/cytoscape.min.js');
  fs.copySync('node_modules/dagre/dist/dagre.min.js', 'dist/media/dagre.min.js');
  fs.copySync('node_modules/cytoscape-dagre/cytoscape-dagre.js', 'dist/media/cytoscape-dagre.js');

  // --- Tree-sitter native module ---
  fs.copySync('node_modules/tree-sitter', 'dist/node_modules/tree-sitter');
  fs.copySync('node_modules/tree-sitter-typescript', 'dist/node_modules/tree-sitter-typescript');

  // --- Extension Build --- 
  const extensionCtx = await esbuild.context({
    entryPoints: ['src/extension.ts'],
    bundle: true,
    format: 'cjs',
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: 'node',
    outfile: 'dist/extension.js',
    external: ['vscode', 'tree-sitter', 'tree-sitter-typescript'],
    logLevel: 'silent',
    plugins: [esbuildProblemMatcherPlugin],
  });

  // --- Webview Build ---
  const webviewCtx = await esbuild.context({
            entryPoints: ['src/webview/main.ts'],
    bundle: true,
    format: 'iife',
    minify: production,
    sourcemap: !production,
        outfile: 'dist/media/main.js',
    logLevel: 'silent',
    plugins: [esbuildProblemMatcherPlugin],
  });

  if (watch) {
    await extensionCtx.watch();
    await webviewCtx.watch();
  } else {
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
