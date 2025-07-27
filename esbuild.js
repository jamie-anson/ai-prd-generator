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
  // @intent: Copy static assets needed by the webview and extension to the dist/media directory for bundling and runtime use
  fs.copySync('node_modules/cytoscape/dist/cytoscape.min.js', 'dist/media/cytoscape.min.js');
  fs.copySync('node_modules/dagre/dist/dagre.min.js', 'dist/media/dagre.min.js');
  fs.copySync('node_modules/cytoscape-dagre/cytoscape-dagre.js', 'dist/media/cytoscape-dagre.js');

  // @intent: Copy native modules required by tree-sitter for syntax analysis into the build output
  // fs.copySync('node_modules/tree-sitter', 'dist/node_modules/tree-sitter');
  // fs.copySync('node_modules/tree-sitter-typescript', 'dist/node_modules/tree-sitter-typescript');
  // Tree-sitter temporarily disabled due to native dependency issues

  // @intent: Build the extension code using esbuild context API
  // @why: This step prepares the extension for use in VSCode by bundling and applying plugins
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

  // @intent: Build the webview code using esbuild context API
  // @why: Bundles and minifies the webview's main.ts for efficient loading in the extension
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

  // @intent: If watch mode is enabled, start watching both extension and webview for changes
  // @why: Enables hot-reloading during development for faster iteration
  if (watch) {
    await extensionCtx.watch();
    await webviewCtx.watch();
  } else {
    // @intent: If not in watch mode, perform a one-time build and cleanup of build contexts
    // @why: Used for production or CI builds where watching is unnecessary
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
