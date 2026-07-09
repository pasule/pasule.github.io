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
    // 跳过空行和非内容行
    if (!line.trim()) { i++; continue; }
    // 进入一个 class 块
    if (/^\s*-?\s*class_name:/.test(line)) {
      i++;
      while (i < lines.length && !/^\s*-?\s*class_name:/.test(lines[i])) {
        if (/^\s*link_list:/.test(lines[i])) {
          i++;
          // 解析 link_list 下的每个友链
          while (i < lines.length) {
            const cur = lines[i];
            if (!cur.trim()) { i++; continue; }
            const dashMatch = cur.match(/^\s*-\s+(\w+):\s*(.*)$/);
            if (!dashMatch) { i++; continue; }
            // 新友链开始（首个字段是 name）
            const item = {};
            item[dashMatch[1]] = stripQ(dashMatch[2]);
            i++;
            // 读取后续缩进字段（无 dash 的续行）
            while (i < lines.length) {
              const sub = lines[i];
              const subMatch = sub.match(/^\s+(\w+):\s*(.*)$/);
              if (subMatch && !/^\s+-/.test(sub)) {
                item[subMatch[1]] = stripQ(subMatch[2]);
                i++;
              } else {
                break; // 下一个 dash 行或空行或下一节
              }
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
