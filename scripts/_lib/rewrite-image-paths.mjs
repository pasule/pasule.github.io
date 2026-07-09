export function rewriteImagePaths(md, slug) {
  let out = md;
  out = out.replace(
    /!\[([^\]]*)\]\(\s*\.?\/?(assets\/[^)]+)\s*\)/g,
    (m, alt, p) => `![${alt}](/${p})`
  );
  out = out.replace(
    /(<img[^>]+src=")\s*\.?\/?(assets\/[^"]+)\s*(")/g,
    (m, pre, p, post) => `${pre}/${p}${post}`
  );
  return out;
}
