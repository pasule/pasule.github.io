---
title: movies
date: 2025-05-24 02:40:55
---

> 🎬 

<div class="movies-container">
  <div class="movie-card">
    <img src="https://pic1.imgdb.cn/item/6831d9bc58cb8da5c80c8931.png" alt="肖申克的救赎" class="movie-poster">
    <div class="movie-info">
      <div class="movie-title">肖申克的救赎 <span class="movie-year">(1994)</span></div>
      <div class="movie-desc">希望让人自由。——豆瓣Top1</div>
    </div>
  </div>
  <!-- 更多电影请仿照上方格式添加，或用数据文件自动生成 -->
</div>

<style>
.movies-container {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}
.movie-card {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  padding: 12px;
  min-width: 220px;
  max-width: 260px;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: box-shadow 0.2s;
}
.movie-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}
.movie-poster {
  width: 100%;
  border-radius: 8px;
  margin-bottom: 10px;
}
.movie-title {
  font-size: 1.1em;
  font-weight: bold;
  color: #222;
}
.movie-year {
  color: #888;
  font-size: 0.95em;
}
.movie-desc {
  margin-top: 4px;
  color: #666;
  font-size: 0.95em;
}
</style>
