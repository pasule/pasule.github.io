export function readFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { fm: {}, body: raw };
  const fm = parseYaml(match[1]);
  const body = match[2];
  return { fm, body };
}

export function writeFrontmatter(fm) {
  const lines = ['---'];
  for (const [k, v] of Object.entries(fm)) {
    lines.push(...serializeValue(k, v));
  }
  lines.push('---');
  return lines.join('\n');
}

function parseYaml(text) {
  const fm = {};
  const lines = text.split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith('#')) { i++; continue; }
    const m = line.match(/^(\w[\w-]*)\s*:\s*(.*)$/);
    if (!m) { i++; continue; }
    const key = m[1];
    const rest = m[2].trim();
    if (rest === '') {
      const arr = [];
      i++;
      while (i < lines.length && /^\s+-\s+/.test(lines[i])) {
        const item = lines[i].replace(/^\s+-\s+/, '').trim();
        arr.push(stripQuotes(item));
        i++;
      }
      fm[key] = arr;
    } else if (rest.startsWith('[') && rest.endsWith(']')) {
      fm[key] = rest.slice(1, -1).split(',').map(s => stripQuotes(s.trim())).filter(Boolean);
    } else {
      fm[key] = stripQuotes(rest);
    }
    i++;
  }
  return fm;
}

function serializeValue(key, v) {
  if (Array.isArray(v)) {
    if (v.length === 0) return [`${key}: []`];
    return [`${key}:`, ...v.map(item => `  - ${yamlScalar(item)}`)];
  }
  if (v === null || v === undefined) return [`${key}: ""`];
  if (typeof v === 'boolean' || typeof v === 'number') return [`${key}: ${v}`];
  return [`${key}: ${yamlScalar(v)}`];
}

function yamlScalar(v) {
  const s = String(v);
  if (/[:#\[\]{}&'*!|>%@`,]/.test(s) || s.includes('\n')) {
    return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  return s;
}

function stripQuotes(s) {
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }
  return s;
}
