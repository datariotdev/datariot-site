const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const output = path.join(root, 'datariot-xyz');
function walk(folder) {
    return fs.readdirSync(folder, { withFileTypes: true }).flatMap(entry => {
        const full = path.join(folder, entry.name);
        return entry.isDirectory() ? walk(full) : [full];
    });
}
const files = walk(output);
const prefixes = new Map();
for (const file of files) {
    const relative = path.relative(output, file).split(path.sep).join('/');
    const match = relative.match(/^(assets\/.*?)node_modules\/(.+)$/);
    if (!match) continue;
    // Static hosting excludes directories named node_modules, including exported font assets.
    const oldPrefix = `${match[1]}node_modules/`;
    const newPrefix = 'assets/vendor/';
    const target = path.join(output, newPrefix, match[2]);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(file, target);
    prefixes.set('/' + oldPrefix, '/' + newPrefix);
}
for (const file of files) {
    if (!/\.(?:js|json|html|css)$/.test(file)) continue;
    let content = fs.readFileSync(file, 'utf8');
    for (const [from, to] of prefixes) content = content.split(from).join(to);
    fs.writeFileSync(file, content);
}
fs.copyFileSync(path.join(output, 'index.html'), path.join(root, 'xyz.html'));
console.log(`Prepared web export with ${prefixes.size} vendor asset prefixes.`);
