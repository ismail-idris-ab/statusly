/// <reference types="nativewind/types" />

declare module '*.css';

// Markdown docs are bundled as assets (see metro.config.js) → asset module id.
declare module '*.md' {
  const asset: number;
  export default asset;
}
