import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const sourceRoot = join(projectRoot, 'src', 'ui');
const outputRoot = join(projectRoot, 'dist', 'ui');

await rm(outputRoot, { recursive: true, force: true });
await buildDirectory(sourceRoot);
console.info('Client built in dist/ui');

async function buildDirectory(directory: string): Promise<void> {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = join(directory, entry.name);
    if (entry.isDirectory()) {
      await buildDirectory(sourcePath);
      continue;
    }

    const relativePath = relative(sourceRoot, sourcePath);
    const extension = extname(sourcePath);
    const outputRelativePath = extension === '.ts'
      ? relativePath.slice(0, -3) + '.js'
      : relativePath;
    const outputPath = join(outputRoot, outputRelativePath);

    await mkdir(dirname(outputPath), { recursive: true });

    if (extension === '.ts') {
      const source = await readFile(sourcePath, 'utf8');
      const stripped = stripTypeScriptTypes(source, { mode: 'strip', sourceUrl: relativePath });
      const browserImports = rewriteTypeScriptImports(stripped);
      await writeFile(outputPath, browserImports, 'utf8');
      continue;
    }

    const content = await readFile(sourcePath);
    await writeFile(outputPath, content);
  }
}

function rewriteTypeScriptImports(source: string): string {
  return source
    .replace(/(from\s+['"])([^'"]+)\.ts(['"])/g, '$1$2.js$3')
    .replace(/(import\s+['"])([^'"]+)\.ts(['"])/g, '$1$2.js$3');
}
