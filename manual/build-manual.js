const { build } = require('esbuild');

const args = process.argv.slice(2);

(async () => {
  await build({
	 entryPoints: ['./src/index.ts'],
	 minify: false,
	 sourcemap: true,
	 bundle: true,
	 outfile: './public/manual.js',
	 format: 'iife',
	 logLevel: 'info',
	 watch: args[0] == 'watch',
  });
})();
