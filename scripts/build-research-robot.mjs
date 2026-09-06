import { build } from 'esbuild';
import { copyFile } from 'node:fs/promises';
await build({
  entryPoints: ['components/robot/research-robot.mjs'],
  outfile: 'js/research-robot.mjs',
  bundle: true,
  format: 'esm',
  target: 'es2020',
  minify: true,
  sourcemap: false,
  legalComments: 'inline'
});
await copyFile('node_modules/three/LICENSE', 'licenses/three-MIT.txt');
