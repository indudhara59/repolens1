const ALLOWED_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".mjs",
  ".cjs",
  ".py",
  ".go",
  ".rs",
  ".java",
  ".kt",
  ".rb",
  ".php",
  ".c",
  ".h",
  ".cpp",
  ".cc",
  ".hpp",
  ".cs",
  ".swift",
  ".scala",
  ".sh",
  ".md",
  ".mdx",
  ".yml",
  ".yaml",
  ".json",
  ".html",
  ".css",
  ".scss",
  ".sql",
  ".graphql",
  ".proto",
  ".toml",
]);

const BLOCKED_PATH_SEGMENTS = new Set([
  "node_modules",
  "vendor",
  "dist",
  "build",
  "out",
  "target",
  "coverage",
  ".git",
  ".next",
  "venv",
  ".venv",
  "__pycache__",
]);

const BLOCKED_BASENAMES = new Set([
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "npm-shrinkwrap.json",
  "Gemfile.lock",
  "Cargo.lock",
  "go.sum",
  "poetry.lock",
  "Pipfile.lock",
  "composer.lock",
  "mix.lock",
]);

const MAX_FILE_SIZE_BYTES = 100 * 1024;

export function shouldIndexFile(path: string, size: number): boolean {
  if (size <= 0 || size > MAX_FILE_SIZE_BYTES) return false;

  const segments = path.split("/");
  const basename = segments[segments.length - 1];

  if (segments.some((segment) => BLOCKED_PATH_SEGMENTS.has(segment))) return false;
  if (BLOCKED_BASENAMES.has(basename)) return false;
  if (basename.includes(".min.")) return false;

  const dotIndex = basename.lastIndexOf(".");
  if (dotIndex <= 0) return false;
  const extension = basename.slice(dotIndex).toLowerCase();
  return ALLOWED_EXTENSIONS.has(extension);
}
