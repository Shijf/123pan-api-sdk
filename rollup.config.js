import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

const external = ['axios', 'form-data'];

// 模块配置
const modules = [
  { name: 'core', input: 'packages/core/src/index.ts' },
  { name: 'file', input: 'packages/file/src/index.ts' },
  { name: 'offline', input: 'packages/offline/src/index.ts' },
  { name: 'user', input: 'packages/user/src/index.ts' },
  { name: 'direct-link', input: 'packages/direct-link/src/index.ts' },
  { name: 'image', input: 'packages/image/src/index.ts' },
  { name: 'video', input: 'packages/video/src/index.ts' },
];

// 通用插件配置
const commonPlugins = [
  resolve({
    preferBuiltins: true,
  }),
  commonjs(),
  typescript({
    tsconfig: './tsconfig.json',
    declaration: false,
  }),
];

// 1. 集合包配置 - 包含所有模块的完整SDK
const bundleConfigs = [
  // ES Module 版本
  {
    input: 'packages/sdk/src/index.ts',
    output: {
      file: 'dist/bundle.esm.js',
      format: 'esm',
      sourcemap: true,
    },
    external,
    plugins: commonPlugins,
  },
  // CommonJS 版本
  {
    input: 'packages/sdk/src/index.ts',
    output: {
      file: 'dist/bundle.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
    },
    external,
    plugins: commonPlugins,
  },
  // UMD 版本 - 用于浏览器直接使用
  {
    input: 'packages/sdk/src/index.ts',
    output: {
      file: 'dist/bundle.umd.js',
      format: 'umd',
      name: 'Pan123SDK',
      sourcemap: true,
      globals: {
        axios: 'axios'
      }
    },
    external,
    plugins: commonPlugins,
  },
];

// 2. 独立模块配置 - 每个模块单独构建
const moduleConfigs = modules.flatMap(module => [
  // ES Module 版本
  {
    input: module.input,
    output: {
      file: `dist/modules/${module.name}.esm.js`,
      format: 'esm',
      sourcemap: true,
    },
    external: [...external, '@123pan/core'], // 模块依赖core包
    plugins: commonPlugins,
  },
  // CommonJS 版本
  {
    input: module.input,
    output: {
      file: `dist/modules/${module.name}.js`,
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
    },
    external: [...external, '@123pan/core'],
    plugins: commonPlugins,
  },
]);

// 3. 主入口配置 - 默认导出集合包
const mainConfigs = [
  // ES Module 版本
  {
    input: 'packages/sdk/src/index.ts',
    output: {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true,
    },
    external,
    plugins: commonPlugins,
  },
  // CommonJS 版本
  {
    input: 'packages/sdk/src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
    },
    external,
    plugins: commonPlugins,
  },
];

// 4. 类型定义文件配置
const dtsConfigs = [
  // 集合包类型定义
  {
    input: 'packages/sdk/src/index.ts',
    output: {
      file: 'dist/bundle.d.ts',
      format: 'esm',
    },
    plugins: [dts({
      tsconfig: './tsconfig.json',
    })],
    external,
  },
  // 主入口类型定义
  {
    input: 'packages/sdk/src/index.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'esm',
    },
    plugins: [dts({
      tsconfig: './tsconfig.json',
    })],
    external,
  },
  // 各模块类型定义
  ...modules.map(module => ({
    input: module.input,
    output: {
      file: `dist/modules/${module.name}.d.ts`,
      format: 'esm',
    },
    plugins: [dts({
      tsconfig: './tsconfig.json',
    })],
    external: [...external, '@123pan/core'],
  })),
];

export default [...mainConfigs, ...bundleConfigs, ...moduleConfigs, ...dtsConfigs];