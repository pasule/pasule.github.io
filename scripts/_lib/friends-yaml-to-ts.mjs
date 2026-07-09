export function friendsYamlToTs(yamlText) {
  const friends = parseLinkYaml(yamlText);
  const items = friends.map(f => `  {\n    title: ${tsStr(f.name)},\n    desc: ${tsStr(f.descr || '')},\n    imgurl: ${tsStr(f.avatar || '')},\n    siteurl: ${tsStr(f.link || '')},\n    tags: [],\n    weight: 0,\n    enabled: true,\n  }`).join(',\n');
  return `[\n${items}\n]`;
}

function parseLinkYaml(text) {
  const out = [];
  const lines = text.split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^-?\s*class_name:/.test(line)) {
      i++;
      while (i < lines.length && !/^-?\s*class_name:/.test(lines[i])) {
        if (/^\s*-?\s*link_list:/.test(lines[i]) || /^\s*link_list:/.test(lines[i])) {
          i++;
          while (i < lines.length && /^\s+-\s/.test(lines[i])) {
            const item = {};
            while (i < lines.length && /^\s+-\s/.test(lines[i])) {
              const m = lines[i].match(/^\s+-\s*(\w+):\s*(.*)$/);
              if (m) item[m[1]] = stripQ(m[2]);
              i++;
            }
            if (item.name) out.push(item);
          }
          continue;
        }
        i++;
      }
      continue;
    }
    i++;
  }
  return out;
}

function tsStr(s) {
  return `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}
function stripQ(s) {
  s = s.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) return s.slice(1, -1);
  return s;
}
