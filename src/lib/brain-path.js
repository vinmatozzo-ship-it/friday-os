function resolveBrainPath(requestedPath, configuredRoot = "PVG-Brain") {
  const root = configuredRoot.replace(/^\/+|\/+$/g, "");
  if (!requestedPath) return root;
  if (typeof requestedPath !== "string") throw new Error("invalid path");

  const path = requestedPath.trim();
  const segments = path.split("/");
  if (
    path.startsWith("/") ||
    path.endsWith("/") ||
    /[\\:%?#]/.test(path) ||
    segments.some((segment) => !segment || segment === "." || segment === "..") ||
    (path !== root && !path.startsWith(`${root}/`))
  ) {
    throw new Error("path must be inside the PVG Brain root");
  }
  return path;
}

module.exports = { resolveBrainPath };
