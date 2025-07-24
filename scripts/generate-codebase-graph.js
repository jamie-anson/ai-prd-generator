// Node.js script to generate a relationship graph (file, class, function level) for the codebase
// Output: ../codebase-graph.json

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src');
const OUT_FILE = path.join(__dirname, '..', 'codebase-graph.json');

function walk(dir, ext = '.ts') {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(filePath, ext));
        } else if (filePath.endsWith(ext)) {
            results.push(filePath);
        }
    });
    return results;
}

function parseFileRelationships(file, relPath) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split(/\r?\n/);
    const nodes = [];
    const edges = [];
    // File node
    nodes.push({ id: relPath, type: 'file', label: path.basename(relPath) });

    // Imports (file-level edges)
    lines.forEach(line => {
        const importMatch = line.match(/import\s+(?:[^'\"]+from\s+)?["'](.+)["']/);
        if (importMatch) {
            let target = importMatch[1];
            if (!target.startsWith('.')) return; // skip node_modules
            // Resolve relative import to file
            let targetPath = path.join(path.dirname(relPath), target);
            if (!targetPath.endsWith('.ts')) targetPath += '.ts';
            edges.push({ source: relPath, target: targetPath, type: 'import' });
        }
    });

    // Classes, interfaces, functions
    lines.forEach((line, idx) => {
        let classMatch = line.match(/class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([\w,\s]+))?/);
        if (classMatch) {
            const [_, className, baseClass, interfaces] = classMatch;
            const nodeId = `${relPath}::class::${className}`;
            nodes.push({ id: nodeId, type: 'class', label: className, file: relPath, line: idx + 1 });
            edges.push({ source: relPath, target: nodeId, type: 'contains' });
            if (baseClass) edges.push({ source: nodeId, target: `${relPath}::class::${baseClass}`, type: 'extends' });
            if (interfaces) {
                interfaces.split(',').map(i => i.trim()).forEach(intf => {
                    edges.push({ source: nodeId, target: `${relPath}::interface::${intf}`, type: 'implements' });
                });
            }
        }
        let interfaceMatch = line.match(/interface\s+(\w+)/);
        if (interfaceMatch) {
            const intfName = interfaceMatch[1];
            const nodeId = `${relPath}::interface::${intfName}`;
            nodes.push({ id: nodeId, type: 'interface', label: intfName, file: relPath, line: idx + 1 });
            edges.push({ source: relPath, target: nodeId, type: 'contains' });
        }
        let funcMatch = line.match(/function\s+(\w+)/);
        if (funcMatch) {
            const funcName = funcMatch[1];
            const nodeId = `${relPath}::func::${funcName}`;
            nodes.push({ id: nodeId, type: 'function', label: funcName, file: relPath, line: idx + 1 });
            edges.push({ source: relPath, target: nodeId, type: 'contains' });
        }
    });
    // TODO: Function calls (could use a parser for more accuracy)
    return { nodes, edges };
}

function main() {
    const files = walk(SRC_DIR);
    let allNodes = [];
    let allEdges = [];
    files.forEach(file => {
        const relPath = path.relative(path.join(__dirname, '..'), file);
        const { nodes, edges } = parseFileRelationships(file, relPath);
        allNodes = allNodes.concat(nodes);
        allEdges = allEdges.concat(edges);
    });
    fs.writeFileSync(OUT_FILE, JSON.stringify({ nodes: allNodes, edges: allEdges }, null, 2));
    console.log(`Codebase graph written to ${OUT_FILE} with ${allNodes.length} nodes and ${allEdges.length} edges.`);
}

main();
