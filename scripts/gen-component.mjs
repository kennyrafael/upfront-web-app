#!/usr/bin/env node
// Usage: npm run gen:component -- Button atoms
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const CATEGORIES = ['atoms', 'molecules', 'organisms', 'layouts'];

const [name, category] = process.argv.slice(2);

if (!name || !category) {
  console.error('Usage: npm run gen:component -- <Name> <atoms|molecules|organisms|layouts>');
  process.exit(1);
}

if (!CATEGORIES.includes(category)) {
  console.error(`Unknown category "${category}". Expected one of: ${CATEGORIES.join(', ')}`);
  process.exit(1);
}

if (!/^[A-Z][A-Za-z0-9]*$/.test(name)) {
  console.error(`Component name must be PascalCase, got "${name}".`);
  process.exit(1);
}

const categoryDir = path.join('src', 'components', category);
const componentDir = path.join(categoryDir, name);

if (existsSync(componentDir)) {
  console.error(`${componentDir} already exists.`);
  process.exit(1);
}

const component = `import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface ${name}Props {
  className?: string;
  children?: ReactNode;
}

export function ${name}({ className, children }: ${name}Props) {
  return <div className={cn(className)}>{children}</div>;
}
`;

await mkdir(componentDir, { recursive: true });
await writeFile(path.join(componentDir, `${name}.tsx`), component);
await writeFile(path.join(componentDir, 'index.ts'), `export * from './${name}';\n`);

// Keep the category barrel sorted so generated entries do not churn the diff.
const barrelPath = path.join(categoryDir, 'index.ts');
const existing = existsSync(barrelPath) ? await readFile(barrelPath, 'utf8') : '';
const lines = new Set(existing.split('\n').filter(Boolean));
lines.add(`export * from './${name}';`);
await writeFile(barrelPath, `${[...lines].sort().join('\n')}\n`);

console.log(`Created ${componentDir}`);
