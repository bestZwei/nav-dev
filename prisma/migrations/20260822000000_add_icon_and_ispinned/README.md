# 添加分类图标与站点置顶字段

## 描述
为 Category 表添加图标字段，为 Site 表添加置顶字段及索引。

## 字段变更

### Category 表
- `icon` (TEXT, 可选) - 分类图标（图标名称或路径）

### Site 表
- `isPinned` (BOOLEAN, 默认 false) - 是否置顶显示
- 新增索引 `Site_isPinned_idx` 用于置顶排序查询

## 版本
v0.1.6

## 日期
2026-08-22
