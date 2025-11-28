import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/plugin/controller.ts'],
  bundle: true,
  outfile: 'dist/plugin.js',
  format: 'iife',
  target: 'es2020',
  minify: false,
  sourcemap: false,
});

console.log('Plugin built successfully');
