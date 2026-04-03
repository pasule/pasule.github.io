---
title: link
date: 2025-05-24 02:00:53
---

<div class="links-container">
  <div class="link-card">
    <img src="https://avatars.githubusercontent.com/u/1?v=4" alt="示例头像" class="link-avatar">
    <div class="link-info">
      <a href="https://example.com" target="_blank" class="link-name">示例友链</a>
      <p class="link-desc">这里是友链描述，欢迎交换友链！</p>
    </div>
  </div>
  <!-- 更多友链请仿照上方格式添加 -->
</div>

<style>
.links-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}
.link-card {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  padding: 16px;
  min-width: 260px;
  max-width: 350px;
  transition: box-shadow 0.2s;
}
.link-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}
.link-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  margin-right: 16px;
  border: 2px solid #eee;
}
.link-info {
  flex: 1;
}
.link-name {
  font-size: 1.1em;
  font-weight: bold;
  color: #0078e7;
  text-decoration: none;
}
.link-desc {
  margin: 4px 0 0 0;
  color: #666;
  font-size: 0.95em;
}
</style>
