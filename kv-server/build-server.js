const { build } = require('esbuild');

const args = process.argv.slice(2);

(async () => {
  await build({
	 entryPoints: ['./src/index.ts', './src/pi.ts'],
	 sourcemap: true,
	 bundle: false,
	 outdir: './out',
	 format: 'cjs',
	 platform: 'node',
	 logLevel: 'info',
	 watch: args[0] == 'watch',
  });
})();
