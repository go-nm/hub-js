import typescript from 'rollup-plugin-typescript2';
import filesize from 'rollup-plugin-filesize';
import minify from 'rollup-plugin-babel-minify';
import pkg from './package.json';

const config = {
  input: './src/index.ts',
  output: [
    { format: 'cjs', file: pkg.main },
    { format: 'es', file: pkg.module },
  ],
  plugins: [
    typescript({
      clean: true,
		}),
		minify({
			comments: false,
			sourceMap: false,
		}),
    filesize(),
  ],
};

export default config;
