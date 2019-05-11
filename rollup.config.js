import typescript from 'rollup-plugin-typescript2';
import filesize from 'rollup-plugin-filesize';
import pkg from './package.json';

const config = {
  input: './index.ts',
  output: [
    { format: 'cjs', file: pkg.main },
    { format: 'es', file: pkg.module },
  ],
  plugins: [
    typescript({
      clean: true,
    }),
    filesize(),
  ],
};

export default config;
