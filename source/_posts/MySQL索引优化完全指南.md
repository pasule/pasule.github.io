---
title: MySQL索引优化完全指南：从原理到实战
date: 2025-09-15 09:30
updated: 2025-12-01 15:30
tags: [MySQL,数据库,索引,性能优化,SQL]
categories: [数据库技术]
description: 深入理解MySQL索引的工作原理，掌握索引设计与查询优化的核心技巧。
cover: https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/mysql.svg
series: 数据库性能线
difficulty: intermediate
keywords: [MySQL, 索引, SQL, B+树]
hero_desc: 用索引作为数据库性能线的入口，后续可以自然接到 EXPLAIN 和慢查询定位。
recommended_next:
  - Java并发编程深度解析：从理论到实践
---

# MySQL索引优化完全指南：从原理到实战

> 🗃️ **核心知识点**
> - 理解B+树索引的底层原理
> - 掌握索引设计的黄金法则
> - 学会分析和优化慢查询
> - 避免常见的索引失效场景

## 📚 什么是索引？

索引是数据库中用于**加速数据检索**的数据结构，类似于书籍的目录。没有索引时，数据库需要全表扫描；有了索引，可以快速定位数据。

## 🌲 B+树索引原理

### 为什么选择B+树？

| 数据结构 | 查询复杂度 | 范围查询 | 磁盘IO |
|----------|-----------|----------|--------|
| 哈希表 | O(1) | ❌ 不支持 | 较少 |
| 二叉树 | O(log n) | ✅ 支持 | 较多 |
| **B+树** | O(log n) | ✅ 支持 | **最少** |

### B+树结构示意

```
                    [根节点: 50]
                   /            \
          [20, 35]              [70, 85]
         /    |    \           /    |    \
      [10,15] [25,30] [40,45] [60,65] [75,80] [90,95]
         ↓       ↓       ↓       ↓       ↓       ↓
       数据    数据    数据    数据    数据    数据
       
       叶子节点通过双向链表相连，支持范围查询
```

## 🎯 索引类型详解

### 1. 主键索引 (Primary Key)

```sql
-- 创建表时定义主键
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL
);

-- InnoDB中，主键索引即聚簇索引，数据存储在叶子节点
```

### 2. 唯一索引 (Unique Index)

```sql
-- 保证列值唯一
CREATE UNIQUE INDEX idx_email ON users(email);

-- 或在创建表时定义
CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    email VARCHAR(100) UNIQUE
);
```

### 3. 普通索引 (Normal Index)

```sql
-- 最基本的索引类型
CREATE INDEX idx_username ON users(username);
```

### 4. 联合索引 (Composite Index)

```sql
-- 多列组合索引，遵循最左前缀原则
CREATE INDEX idx_name_age_city ON users(name, age, city);

-- ✅ 能使用索引的查询
SELECT * FROM users WHERE name = '张三';
SELECT * FROM users WHERE name = '张三' AND age = 25;
SELECT * FROM users WHERE name = '张三' AND age = 25 AND city = '北京';

-- ❌ 无法使用索引的查询
SELECT * FROM users WHERE age = 25;  -- 跳过了name
SELECT * FROM users WHERE city = '北京';  -- 跳过了name和age
```

### 5. 覆盖索引 (Covering Index)

```sql
-- 当查询的列都在索引中时，无需回表
CREATE INDEX idx_name_email ON users(name, email);

-- ✅ 覆盖索引，不需要回表
SELECT name, email FROM users WHERE name = '张三';

-- ❌ 需要回表获取其他列
SELECT * FROM users WHERE name = '张三';
```

## 🔧 EXPLAIN分析查询

```sql
EXPLAIN SELECT * FROM orders WHERE user_id = 100 AND status = 'paid';
```

### EXPLAIN关键字段解读

| 字段 | 说明 | 优化目标 |
|------|------|----------|
| **type** | 访问类型 | system > const > eq_ref > ref > range > index > ALL |
| **key** | 实际使用的索引 | 应该使用预期的索引 |
| **rows** | 预估扫描行数 | 越小越好 |
| **Extra** | 额外信息 | 避免Using filesort, Using temporary |

### type类型详解

```sql
-- const: 主键或唯一索引的等值查询
EXPLAIN SELECT * FROM users WHERE id = 1;

-- ref: 普通索引的等值查询
EXPLAIN SELECT * FROM users WHERE username = 'admin';

-- range: 范围查询
EXPLAIN SELECT * FROM users WHERE age BETWEEN 20 AND 30;

-- ALL: 全表扫描（需要优化！）
EXPLAIN SELECT * FROM users WHERE age + 1 = 25;
```

## ⚠️ 索引失效的常见场景

### 1. 对索引列使用函数

```sql
-- ❌ 索引失效
SELECT * FROM users WHERE YEAR(create_time) = 2024;

-- ✅ 优化后
SELECT * FROM users WHERE create_time >= '2024-01-01' AND create_time < '2025-01-01';
```

### 2. 隐式类型转换

```sql
-- 假设 phone 是 VARCHAR 类型
-- ❌ 索引失效（数字与字符串比较）
SELECT * FROM users WHERE phone = 13800138000;

-- ✅ 正确写法
SELECT * FROM users WHERE phone = '13800138000';
```

### 3. LIKE以通配符开头

```sql
-- ❌ 索引失效
SELECT * FROM users WHERE name LIKE '%张';

-- ✅ 可以使用索引
SELECT * FROM users WHERE name LIKE '张%';
```

### 4. OR条件未全部建立索引

```sql
-- 假设只有name有索引，age没有
-- ❌ 索引失效
SELECT * FROM users WHERE name = '张三' OR age = 25;

-- ✅ 解决方案1：给age也建索引
-- ✅ 解决方案2：改用UNION
SELECT * FROM users WHERE name = '张三'
UNION
SELECT * FROM users WHERE age = 25;
```

### 5. 不等于操作

```sql
-- ❌ 可能不走索引
SELECT * FROM users WHERE status != 'deleted';

-- ✅ 如果非删除数据占大多数，可以改写
SELECT * FROM users WHERE status IN ('active', 'pending', 'blocked');
```

## 💡 索引设计最佳实践

### 1. 选择性高的列优先

```sql
-- 选择性 = 不重复值数量 / 总行数
SELECT 
    COUNT(DISTINCT status) / COUNT(*) AS status_selectivity,
    COUNT(DISTINCT user_id) / COUNT(*) AS user_id_selectivity
FROM orders;

-- user_id选择性更高，应该放在联合索引前面
CREATE INDEX idx_user_status ON orders(user_id, status);
```

### 2. 频繁查询的列建索引

```sql
-- 分析慢查询日志，找出高频查询条件
-- 为WHERE、JOIN、ORDER BY、GROUP BY涉及的列建索引
```

### 3. 控制索引数量

```sql
-- ❌ 索引过多会影响写入性能
CREATE INDEX idx_a ON table(a);
CREATE INDEX idx_b ON table(b);
CREATE INDEX idx_c ON table(c);
CREATE INDEX idx_ab ON table(a, b);
CREATE INDEX idx_bc ON table(b, c);

-- ✅ 合理设计联合索引，一个索引覆盖多个查询场景
CREATE INDEX idx_abc ON table(a, b, c);
```

### 4. 长字符串使用前缀索引

```sql
-- 对于长字符串，使用前缀索引节省空间
CREATE INDEX idx_email_prefix ON users(email(10));

-- 选择合适的前缀长度
SELECT 
    COUNT(DISTINCT LEFT(email, 5)) / COUNT(*) AS len5,
    COUNT(DISTINCT LEFT(email, 10)) / COUNT(*) AS len10,
    COUNT(DISTINCT LEFT(email, 15)) / COUNT(*) AS len15
FROM users;
```

## 📊 实战案例：电商订单表优化

### 原始表结构

```sql
CREATE TABLE orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_no VARCHAR(32) NOT NULL,
    user_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status TINYINT NOT NULL DEFAULT 0,
    create_time DATETIME NOT NULL,
    update_time DATETIME NOT NULL
);
```

### 常见查询场景分析

```sql
-- 场景1：根据订单号查询（高频，需要快速定位）
SELECT * FROM orders WHERE order_no = 'ORD202412010001';
-- 建议：唯一索引
CREATE UNIQUE INDEX idx_order_no ON orders(order_no);

-- 场景2：查询用户的订单列表（高频）
SELECT * FROM orders WHERE user_id = 100 ORDER BY create_time DESC;
-- 建议：联合索引
CREATE INDEX idx_user_time ON orders(user_id, create_time DESC);

-- 场景3：后台查询某状态的订单（中频）
SELECT * FROM orders WHERE status = 1 AND create_time > '2024-12-01';
-- 建议：联合索引
CREATE INDEX idx_status_time ON orders(status, create_time);

-- 场景4：统计某商品的销售额
SELECT SUM(amount) FROM orders WHERE product_id = 500 AND status = 2;
-- 建议：联合索引 + 覆盖索引
CREATE INDEX idx_product_status_amount ON orders(product_id, status, amount);
```

### 最终索引设计

```sql
-- 精简后的索引方案
CREATE UNIQUE INDEX idx_order_no ON orders(order_no);
CREATE INDEX idx_user_time ON orders(user_id, create_time DESC);
CREATE INDEX idx_status_time ON orders(status, create_time);
CREATE INDEX idx_product_status ON orders(product_id, status);
```

## 🔍 慢查询优化流程

```
1. 开启慢查询日志
   ↓
2. 分析慢查询日志，找出问题SQL
   ↓
3. 使用EXPLAIN分析执行计划
   ↓
4. 检查是否缺少索引或索引失效
   ↓
5. 优化SQL或添加/调整索引
   ↓
6. 测试验证优化效果
```

### 开启慢查询日志

```sql
-- 查看当前配置
SHOW VARIABLES LIKE 'slow_query%';
SHOW VARIABLES LIKE 'long_query_time';

-- 开启慢查询日志
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;  -- 超过1秒的查询记录
```

## 🚀 总结

### 索引优化口诀

1. **最左前缀要牢记**，联合索引按顺序
2. **覆盖索引减回表**，查询效率大提升
3. **函数运算要避免**，索引列保持原样
4. **类型转换是大坑**，字段类型要匹配
5. **选择性高放前面**，区分度大更有效

### 性能优化checklist

- ✅ 为高频查询条件建立索引
- ✅ 使用EXPLAIN验证索引使用情况
- ✅ 避免索引失效的写法
- ✅ 定期分析和优化慢查询
- ✅ 控制单表索引数量（建议不超过5-6个）

---

**如果这篇文章对你有帮助，欢迎点赞分享！** 💪
