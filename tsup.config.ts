import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/main.ts',
  ],
  outDir: 'dist',
  format: 'esm',
  dts: {
    resolve: false,
  },
  sourcemap: true,
  minify: true,
  clean: true,
  splitting: false,
})
