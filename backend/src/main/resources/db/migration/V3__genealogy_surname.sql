-- 前端建谱必填「姓氏」；产品活数据录入自动带入姓氏
ALTER TABLE genealogy
  ADD COLUMN surname VARCHAR(32) NULL COMMENT '本族姓氏' AFTER name;
