// Node.js script to generate a JSON index of all structured comments in the codebase
// Tags: @intent, @why, @todo, @risk, @data, @unclear
// Output: ../comment-index.json

const fs = require('fs');
const path = require('path');

const TAGS = ['@intent', '@why', '@todo', '@risk', '@data', '@unclear'];
const SRC_DIR = path.join(__dirname, '..', 'src');
const OUT_FILE = path.join(__dirname, '..', 'comment-index.json');

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

function extractComments(file, relPath) {
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    const entries = [];
    lines.forEach((line, idx) => {
        for (const tag of TAGS) {
            const tagIdx = line.indexOf(tag);
            if (tagIdx !== -1) {
                // Extract comment text after tag (strip //, /*, *, etc.)
                let text = line.slice(tagIdx + tag.length).replace(/^[^\w]*|\*\//g, '').trim();
                if (!text) text = '(no comment text)';
                entries.push({
                    tag,
                    file: relPath,
                    line: idx + 1,
                    text
                });
            }
        }
    });
    return entries;
}

function main() {
    const files = walk(SRC_DIR);
    let index = [];
    files.forEach(file => {
        const relPath = path.relative(path.join(__dirname, '..'), file);
        index = index.concat(extractComments(file, relPath));
    });
    fs.writeFileSync(OUT_FILE, JSON.stringify(index, null, 2));
    console.log(`Comment index written to ${OUT_FILE} with ${index.length} entries.`);
}

main();
