---
title: Git工作流与团队协作最佳实践
date: 2025-08-10 16:45
updated: 2025-12-01 15:30
tags: [Git,版本控制,团队协作,DevOps]
categories: [开发工具]
description: 从入门到精通，掌握Git版本控制和团队协作的核心技能。
cover: https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/git.svg
series: 工程协作线
difficulty: beginner
keywords: [Git, 协作, DevOps, Pull Request]
hero_desc: 用 Git 工作流把个人开发和团队协作习惯串起来，方便后续扩展 Code Review 与发布流程文章。
recommended_next:
  - 微服务架构设计原理与最佳实践
---

# Git工作流与团队协作最佳实践

> 🔀 **你将学到**
> - Git核心概念和常用命令
> - 主流Git工作流对比与选择
> - 代码审查与合并策略
> - 解决冲突的技巧

## 🎯 Git基础回顾

### 核心概念图解

```
工作区(Working Directory)
    ↓ git add
暂存区(Staging Area)  
    ↓ git commit
本地仓库(Local Repository)
    ↓ git push
远程仓库(Remote Repository)
```

### 常用命令速查

```bash
# 初始化与克隆
git init                      # 初始化仓库
git clone <url>               # 克隆远程仓库

# 日常操作
git status                    # 查看状态
git add .                     # 添加所有修改到暂存区
git commit -m "message"       # 提交
git push origin main          # 推送到远程

# 分支操作
git branch                    # 查看分支
git branch feature-x          # 创建分支
git checkout feature-x        # 切换分支
git checkout -b feature-x     # 创建并切换分支
git merge feature-x           # 合并分支
git branch -d feature-x       # 删除分支

# 查看历史
git log --oneline --graph     # 图形化查看提交历史
git diff                      # 查看修改内容
git blame <file>              # 查看文件每行的修改者

# 撤销操作
git checkout -- <file>        # 撤销工作区修改
git reset HEAD <file>         # 取消暂存
git reset --soft HEAD~1       # 撤销上次提交(保留修改)
git reset --hard HEAD~1       # 撤销上次提交(丢弃修改)
git revert <commit>           # 创建一个撤销提交

# 储藏
git stash                     # 储藏当前修改
git stash pop                 # 恢复储藏
git stash list                # 查看储藏列表
```

## 🔄 主流Git工作流

### 1. Git Flow

适用于**发布周期固定**的项目。

```
main ─────●───────────────●─────────────●──────→
          │               ↑             ↑
          │    ┌──────────┘   ┌─────────┘
          ↓    │              │
develop ──●────●────●────●────●────●────●──────→
               │    ↑    │         ↑
               │    │    │         │
feature/a ─────●────┘    │         │
                         │         │
feature/b ───────────────●─────────┘
```

**分支说明**：
- `main`: 生产环境代码
- `develop`: 开发主分支
- `feature/*`: 功能分支
- `release/*`: 发布分支
- `hotfix/*`: 紧急修复分支

```bash
# Git Flow 工作流程示例
# 1. 开始新功能
git checkout develop
git checkout -b feature/user-login

# 2. 开发完成后合并
git checkout develop
git merge --no-ff feature/user-login
git branch -d feature/user-login

# 3. 准备发布
git checkout -b release/v1.0.0
# 进行发布前测试和修复

# 4. 发布
git checkout main
git merge --no-ff release/v1.0.0
git tag -a v1.0.0 -m "Release v1.0.0"

git checkout develop
git merge --no-ff release/v1.0.0
git branch -d release/v1.0.0
```

### 2. GitHub Flow

适用于**持续部署**的项目，简单高效。

```
main ─────●───────●───────●───────●───────→
          │       ↑       │       ↑
          │       │       │       │
feature ──●───●───┘       │       │
                          │       │
bugfix ───────────────────●───●───┘
```

**流程**：
1. 从main创建分支
2. 开发并提交
3. 创建Pull Request
4. 代码审查
5. 合并到main并部署

```bash
# GitHub Flow 示例
# 1. 创建功能分支
git checkout main
git pull origin main
git checkout -b feature/shopping-cart

# 2. 开发提交
git add .
git commit -m "feat: add shopping cart functionality"
git push origin feature/shopping-cart

# 3. 在GitHub上创建PR，通过审查后合并
# 4. 删除功能分支
git checkout main
git pull origin main
git branch -d feature/shopping-cart
```

### 3. Trunk-Based Development

适用于**高度自动化测试**的团队。

```
main ─────●───●───●───●───●───●───●───────→
          │   │   │   │   │   │   │
         短期分支(小时级别)
```

**特点**：
- 所有开发者直接向main提交
- 分支生命周期很短（几小时到1天）
- 依赖Feature Flag控制功能发布

## 📝 Commit Message规范

### Conventional Commits格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type类型

| 类型 | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | feat: 添加用户注册功能 |
| `fix` | Bug修复 | fix: 修复登录验证码失效问题 |
| `docs` | 文档更新 | docs: 更新API文档 |
| `style` | 代码格式 | style: 格式化代码 |
| `refactor` | 重构 | refactor: 重构用户模块 |
| `perf` | 性能优化 | perf: 优化首页加载速度 |
| `test` | 测试 | test: 添加单元测试 |
| `chore` | 构建/工具 | chore: 更新依赖版本 |

### 示例

```bash
# 好的提交信息
git commit -m "feat(auth): 添加JWT token刷新机制

- 实现token自动刷新
- 添加token过期前5分钟自动续期
- 修改登录接口返回refresh_token

Closes #123"

# 不好的提交信息
git commit -m "修改了一些代码"
git commit -m "update"
git commit -m "fix bug"
```

## 🔀 合并策略

### 1. Merge Commit

```bash
git checkout main
git merge --no-ff feature/xxx
```

```
      A---B---C  feature
     /         \
D---E-----------F  main (merge commit)
```

**优点**：保留完整历史，可追溯
**缺点**：历史记录较多

### 2. Squash Merge

```bash
git checkout main
git merge --squash feature/xxx
git commit -m "feat: add new feature"
```

```
A---B---C  feature

D---E---F  main (squash成一个提交)
```

**优点**：历史简洁
**缺点**：丢失详细提交记录

### 3. Rebase

```bash
git checkout feature/xxx
git rebase main
git checkout main
git merge feature/xxx
```

```
      A---B---C  feature (before rebase)

D---E---A'---B'---C'  main (after rebase + merge)
```

**优点**：线性历史，整洁
**缺点**：改写历史，需谨慎使用

## ⚔️ 解决冲突

### 冲突示例

```
<<<<<<< HEAD
console.log("这是main分支的代码");
=======
console.log("这是feature分支的代码");
>>>>>>> feature/xxx
```

### 解决步骤

```bash
# 1. 拉取最新代码
git fetch origin
git checkout feature/xxx
git rebase origin/main

# 2. 出现冲突时，手动编辑文件解决
# 3. 标记冲突已解决
git add <conflicted-file>

# 4. 继续rebase
git rebase --continue

# 5. 如果想放弃
git rebase --abort
```

### 使用VS Code解决冲突

VS Code提供了直观的冲突解决界面：
- **Accept Current Change**: 保留当前分支修改
- **Accept Incoming Change**: 使用合并进来的修改
- **Accept Both Changes**: 保留两者
- **Compare Changes**: 对比查看差异

## 🛡️ 代码审查最佳实践

### PR/MR检查清单

- ✅ 代码符合编码规范
- ✅ 有足够的测试覆盖
- ✅ 没有敏感信息泄露
- ✅ 性能影响已评估
- ✅ 文档已更新
- ✅ Commit message规范

### 审查者要点

```markdown
## 审查重点

1. **功能正确性**: 代码是否实现了预期功能？
2. **代码质量**: 是否遵循设计原则？有无代码异味？
3. **安全性**: 是否存在安全漏洞？
4. **性能**: 是否有性能问题？
5. **可维护性**: 代码是否易于理解和维护？
6. **测试**: 测试是否充分？
```

## 🚀 实用技巧

### 1. 交互式Rebase整理提交

```bash
# 整理最近3次提交
git rebase -i HEAD~3

# 在编辑器中可以：
# pick - 保留提交
# squash - 合并到上一个提交
# reword - 修改提交信息
# drop - 删除提交
```

### 2. Cherry-pick选择性合并

```bash
# 将某个提交应用到当前分支
git cherry-pick <commit-hash>

# 应用多个提交
git cherry-pick <commit1> <commit2>
```

### 3. Bisect二分查找Bug

```bash
# 开始二分查找
git bisect start

# 标记当前版本有bug
git bisect bad

# 标记某个版本正常
git bisect good v1.0.0

# Git会自动检出中间版本，测试后标记good/bad
# 直到找到引入bug的提交

# 结束
git bisect reset
```

### 4. 配置别名提高效率

```bash
# 在 ~/.gitconfig 添加
[alias]
    st = status
    co = checkout
    br = branch
    cm = commit -m
    lg = log --oneline --graph --decorate
    unstage = reset HEAD --
    last = log -1 HEAD
    visual = !gitk
```

## 📊 团队协作规范模板

```markdown
# Git协作规范

## 分支命名
- 功能分支: feature/功能名称
- 修复分支: fix/问题描述
- 热修复: hotfix/问题描述

## 提交规范
- 使用Conventional Commits格式
- 每个提交应该是原子性的
- 禁止提交未完成的代码到主分支

## 代码审查
- 所有代码必须经过至少1人审查
- 审查通过后才能合并
- 合并前需要通过CI检查

## 发布流程
1. 创建release分支
2. 测试验证
3. 合并到main并打tag
4. 同步到develop
```

---

**掌握Git，让团队协作更高效！** 🎉
