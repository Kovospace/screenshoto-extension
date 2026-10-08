// Vite/Vitest `?raw` imports: a file's contents as a string (used to test against real markup).
declare module '*?raw' {
  const content: string;
  export default content;
}
