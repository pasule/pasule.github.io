---
title: gallery
date: 2025-05-24 03:00:20
---

> 📷 这里是我的相册，记录美好瞬间。

<div class="gallery-container">
  <div class="gallery-item">
    <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400" alt="示例图片">
    <div class="gallery-caption">美丽的风景</div>
  </div>
  <!-- 更多图片请仿照上方格式添加 -->
</div>

<style>
.gallery-container {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  margin-top: 20px;
}
.gallery-item {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  padding: 8px;
  width: 200px;
  text-align: center;
}
.gallery-item img {
  width: 100%;
  border-radius: 6px;
}
.gallery-caption {
  margin-top: 6px;
  color: #666;
  font-size: 0.97em;
}
</style> 
