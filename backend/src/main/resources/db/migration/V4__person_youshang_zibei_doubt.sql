-- 前端人物表单：幼殇标注、字辈存疑（产品可存+存疑）
ALTER TABLE person
  ADD COLUMN is_youshang TINYINT NOT NULL DEFAULT 0 COMMENT '幼殇标注 0否1是' AFTER is_alive,
  ADD COLUMN zibei_doubt TINYINT NOT NULL DEFAULT 0 COMMENT '字辈存疑 0否1是' AFTER review_note;
