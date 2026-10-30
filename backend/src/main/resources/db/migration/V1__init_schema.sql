-- 家传云谱 MVP 基线表 · 依据 docs/backend 数据库设计大纲 v0.1.1 + 产品 §1.7 + 成员专题 §4
-- 字符集/排序：utf8mb4 / utf8mb4_0900_ai_ci；时间：datetime(3) Asia/Shanghai
-- renewal_item 延后；edit_lock 不落库（Redis）

CREATE TABLE tenant (
  id              BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  tenant_name     VARCHAR(64)  NOT NULL,
  tenant_type     TINYINT      NOT NULL DEFAULT 1 COMMENT '1个人 2家族团体',
  status          TINYINT      NOT NULL DEFAULT 1 COMMENT '1正常 2冻结 3注销中 4已注销',
  frozen_reason   VARCHAR(256) NULL,
  frozen_at       DATETIME(3)  NULL,
  register_source VARCHAR(32)  NOT NULL DEFAULT 'web',
  created_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_tenant_status (status),
  KEY idx_tenant_register_source (register_source)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='租户';

CREATE TABLE `user` (
  id              BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  tenant_id       BIGINT       NOT NULL,
  phone           VARCHAR(20)  NOT NULL,
  nickname        VARCHAR(64)  NOT NULL,
  avatar_url      VARCHAR(512) NULL,
  password_hash   VARCHAR(256) NULL,
  is_primary      TINYINT      NOT NULL DEFAULT 1 COMMENT '是否租户主账号',
  status          TINYINT      NOT NULL DEFAULT 1 COMMENT '1正常 2禁用',
  roles           VARCHAR(128) NOT NULL DEFAULT 'R_USER' COMMENT '平台角色，逗号分隔，如 R_USER,R_ADMIN',
  last_login_at   DATETIME(3)  NULL,
  last_login_ip   VARCHAR(64)  NULL,
  created_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_user_phone (phone),
  KEY idx_user_tenant (tenant_id),
  KEY idx_user_primary (is_primary)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户';

CREATE TABLE subscription (
  id                       BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  tenant_id                BIGINT       NOT NULL,
  plan_type                VARCHAR(32)  NOT NULL COMMENT 'trial/basic/professional',
  status                   TINYINT      NOT NULL DEFAULT 1 COMMENT '1生效中 2已过期 3已取消',
  start_date               DATETIME(3)  NOT NULL,
  expire_date              DATETIME(3)  NOT NULL,
  auto_renew               TINYINT      NOT NULL DEFAULT 0,
  auto_renew_method        VARCHAR(32)  NULL,
  person_quota             INT          NOT NULL,
  storage_quota_mb         INT          NOT NULL,
  person_used              INT          NOT NULL DEFAULT 0 COMMENT '已用人物额度（冗余）',
  storage_used_mb          INT          NOT NULL DEFAULT 0 COMMENT '已用存储MB（冗余）',
  max_collaborators        INT          NOT NULL DEFAULT 0,
  max_continuation_count   INT          NOT NULL DEFAULT 0,
  max_genealogy_count      INT          NOT NULL DEFAULT 1,
  allow_pdf_export         TINYINT      NOT NULL DEFAULT 0,
  allow_batch_export       TINYINT      NOT NULL DEFAULT 0,
  order_id                 BIGINT       NULL,
  version                  BIGINT       NOT NULL DEFAULT 0 COMMENT '乐观锁',
  created_at               DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at               DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_sub_tenant_status (tenant_id, status),
  KEY idx_sub_expire (expire_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='订阅';

CREATE TABLE `order` (
  id                BIGINT         NOT NULL AUTO_INCREMENT PRIMARY KEY,
  order_no          VARCHAR(64)    NOT NULL,
  tenant_id         BIGINT         NOT NULL,
  subscription_id   BIGINT         NULL,
  product_type      VARCHAR(32)    NOT NULL,
  product_name      VARCHAR(128)   NOT NULL,
  amount            DECIMAL(10, 2) NOT NULL,
  original_amount   DECIMAL(10, 2) NULL,
  discount_amount   DECIMAL(10, 2) NULL DEFAULT 0,
  payment_method    VARCHAR(32)    NULL,
  payment_status    TINYINT        NOT NULL DEFAULT 0 COMMENT '0待支付 1已支付 2取消 3退款 4超时',
  paid_at           DATETIME(3)    NULL,
  expired_at        DATETIME(3)    NULL,
  refunded_at       DATETIME(3)    NULL,
  refund_reason     VARCHAR(256)   NULL,
  granted_quota     JSON           NULL,
  admin_user_id     BIGINT         NULL,
  created_by        BIGINT         NOT NULL,
  created_at        DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at        DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_order_no (order_no),
  KEY idx_order_tenant_status_time (tenant_id, payment_status, created_at),
  KEY idx_order_subscription (subscription_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='订单';

CREATE TABLE quota_transaction (
  id               BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  tenant_id        BIGINT       NOT NULL,
  quota_type       VARCHAR(32)  NOT NULL COMMENT 'person/storage',
  change_type      VARCHAR(32)  NOT NULL,
  change_amount    INT          NOT NULL,
  balance_after    INT          NOT NULL,
  genealogy_id     BIGINT       NULL,
  project_id       BIGINT       NULL,
  operator_user_id BIGINT       NOT NULL,
  admin_user_id    BIGINT       NULL,
  remark           VARCHAR(256) NULL,
  order_id         BIGINT       NULL,
  created_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_quota_tenant_type_time (tenant_id, quota_type, created_at),
  KEY idx_quota_genealogy (genealogy_id),
  KEY idx_quota_change_type (change_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='额度流水';

CREATE TABLE genealogy (
  id                 BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  tenant_id          BIGINT       NOT NULL,
  genealogy_no       VARCHAR(32)  NOT NULL COMMENT '对外编号 非邀请码',
  name               VARCHAR(64)  NOT NULL,
  tanghao            VARCHAR(32)  NULL,
  shizu_name         VARCHAR(32)  NULL,
  shizu_generation   INT          NULL,
  zibei_poem         TEXT         NULL,
  zibei_start_gen    INT          NULL,
  privacy_mode       TINYINT      NOT NULL DEFAULT 1,
  living_desensitize TINYINT      NOT NULL DEFAULT 1,
  owner_user_id      BIGINT       NOT NULL,
  mode               VARCHAR(16)  NOT NULL DEFAULT 'standard' COMMENT 'standard/simple',
  status             TINYINT      NOT NULL DEFAULT 1 COMMENT '1正常 2回收站 3已软删',
  deleted_at         DATETIME(3)  NULL,
  created_at         DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at         DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_genealogy_tenant_no (tenant_id, genealogy_no),
  KEY idx_genealogy_tenant_status (tenant_id, status),
  KEY idx_genealogy_owner (owner_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='族谱';

CREATE TABLE collaborator (
  id            BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  genealogy_id  BIGINT       NOT NULL,
  user_id       BIGINT       NOT NULL,
  role          VARCHAR(32)  NOT NULL,
  invite_status TINYINT      NOT NULL DEFAULT 1,
  invite_token  VARCHAR(128) NULL,
  invited_by    BIGINT       NULL,
  invited_at    DATETIME(3)  NULL,
  joined_at     DATETIME(3)  NULL,
  expire_at     DATETIME(3)  NULL,
  branch_scope  JSON         NULL,
  created_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_collab_genealogy_user (genealogy_id, user_id),
  KEY idx_collab_status (genealogy_id, invite_status),
  KEY idx_collab_user (user_id),
  KEY idx_collab_token (invite_token),
  KEY idx_collab_role (genealogy_id, role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='协作成员L2';

CREATE TABLE genealogy_member (
  id               BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  genealogy_id     BIGINT       NOT NULL,
  user_id          BIGINT       NOT NULL,
  display_name     VARCHAR(64)  NULL,
  status           TINYINT      NOT NULL DEFAULT 1 COMMENT '1正常 2已退出 3被移除',
  join_source      VARCHAR(32)  NOT NULL,
  invite_code_used VARCHAR(32)  NULL,
  joined_at        DATETIME(3)  NOT NULL,
  left_at          DATETIME(3)  NULL,
  created_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_member_genealogy_user (genealogy_id, user_id),
  KEY idx_member_user_status (user_id, status),
  KEY idx_member_genealogy_status (genealogy_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='族谱成员L1';

CREATE TABLE genealogy_invite_code (
  id           BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  genealogy_id BIGINT       NOT NULL,
  code         VARCHAR(16)  NOT NULL,
  status       TINYINT      NOT NULL DEFAULT 1 COMMENT '1有效 0作废',
  max_uses     INT          NULL,
  used_count   INT          NOT NULL DEFAULT 0,
  expire_at    DATETIME(3)  NULL,
  created_by   BIGINT       NOT NULL,
  created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  revoked_at   DATETIME(3)  NULL,
  UNIQUE KEY uk_invite_code (code),
  KEY idx_invite_genealogy_status (genealogy_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='成员邀请码';

CREATE TABLE person (
  id                        BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  genealogy_id              BIGINT       NOT NULL,
  project_id                BIGINT       NULL COMMENT '仅追溯，非归属',
  person_no                 VARCHAR(64)  NOT NULL,
  generation                INT          NOT NULL,
  name_wei                  VARCHAR(32)  NULL,
  name_zi                   VARCHAR(32)  NULL,
  name_hao                  VARCHAR(64)  NULL,
  xingdi                    VARCHAR(32)  NULL,
  zibei                     VARCHAR(16)  NULL,
  gender                    TINYINT      NOT NULL DEFAULT 0,
  birth_date                VARCHAR(32)  NULL,
  death_date                VARCHAR(32)  NULL,
  is_alive                  TINYINT      NOT NULL DEFAULT 1,
  native_place              VARCHAR(128) NULL,
  burial_place              VARCHAR(256) NULL,
  biography                 TEXT         NULL,
  privacy_level             TINYINT      NOT NULL DEFAULT 1,
  source_person_no          VARCHAR(64)  NULL,
  is_changed_since_archive  TINYINT      NOT NULL DEFAULT 0,
  review_status             TINYINT      NOT NULL DEFAULT 0,
  review_note               VARCHAR(512) NULL,
  created_by                BIGINT       NOT NULL,
  updated_by                BIGINT       NOT NULL,
  created_at                DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at                DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  is_deleted                TINYINT      NOT NULL DEFAULT 0,
  deleted_at                DATETIME(3)  NULL,
  UNIQUE KEY uk_person_genealogy_no (genealogy_id, person_no),
  KEY idx_person_generation (genealogy_id, generation),
  KEY idx_person_changed (genealogy_id, is_changed_since_archive),
  KEY idx_person_name (name_wei, genealogy_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='人物·族谱级活数据';

CREATE TABLE relationship (
  id             BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  genealogy_id   BIGINT       NOT NULL,
  from_person_id BIGINT       NOT NULL,
  to_person_id   BIGINT       NOT NULL,
  rel_type       VARCHAR(32)  NOT NULL,
  is_primary     TINYINT      NOT NULL DEFAULT 1,
  remark         VARCHAR(256) NULL,
  created_by     BIGINT       NOT NULL,
  updated_by     BIGINT       NOT NULL,
  created_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  is_deleted     TINYINT      NOT NULL DEFAULT 0,
  KEY idx_rel_from (genealogy_id, from_person_id),
  KEY idx_rel_to (genealogy_id, to_person_id),
  KEY idx_rel_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='亲属关系·族谱级活数据';

CREATE TABLE project (
  id               BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  genealogy_id     BIGINT       NOT NULL,
  project_type     TINYINT      NOT NULL COMMENT '1初始 2续修',
  batch_no         INT          NOT NULL,
  title            VARCHAR(128) NOT NULL,
  xiupu_year       VARCHAR(32)  NOT NULL,
  current_stage    TINYINT      NOT NULL DEFAULT 1 COMMENT '1-5 五步',
  fanli            TEXT         NULL,
  chief_editor_id  BIGINT       NULL,
  base_version_id  BIGINT       NULL,
  layout_type      VARCHAR(32)  NULL,
  layout_config    JSON         NULL,
  layout_dirty     TINYINT      NOT NULL DEFAULT 0,
  editors          JSON         NULL COMMENT '本期组编名录L3',
  finalized_at     DATETIME(3)  NULL,
  archived_at      DATETIME(3)  NULL,
  created_by       BIGINT       NOT NULL,
  created_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_project_genealogy (genealogy_id),
  KEY idx_project_stage (genealogy_id, current_stage)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='修谱项目';

CREATE TABLE chapter (
  id             BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  genealogy_id   BIGINT       NOT NULL,
  project_id     BIGINT       NULL,
  title          VARCHAR(128) NOT NULL,
  chapter_type   VARCHAR(32)  NOT NULL,
  content        MEDIUMTEXT   NULL,
  author         VARCHAR(64)  NULL,
  sort_order     INT          NOT NULL DEFAULT 0,
  review_status  TINYINT      NOT NULL DEFAULT 0,
  review_note    VARCHAR(512) NULL,
  source_batch_no INT         NULL,
  created_by     BIGINT       NOT NULL,
  created_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  is_deleted     TINYINT      NOT NULL DEFAULT 0,
  KEY idx_chapter_type_sort (genealogy_id, chapter_type, sort_order),
  KEY idx_chapter_project (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='谱书章节';

CREATE TABLE family_event (
  id           BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  genealogy_id BIGINT       NOT NULL,
  title        VARCHAR(128) NOT NULL,
  event_date   VARCHAR(64)  NULL,
  content      TEXT         NULL,
  sort_order   INT          NOT NULL DEFAULT 0,
  created_by   BIGINT       NOT NULL,
  updated_by   BIGINT       NOT NULL,
  created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  is_deleted   TINYINT      NOT NULL DEFAULT 0,
  KEY idx_family_event_genealogy (genealogy_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='家族大事记';

CREATE TABLE family_rule (
  id           BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  genealogy_id BIGINT       NOT NULL,
  title        VARCHAR(128) NOT NULL,
  content      TEXT         NULL,
  sort_order   INT          NOT NULL DEFAULT 0,
  created_by   BIGINT       NOT NULL,
  updated_by   BIGINT       NOT NULL,
  created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  is_deleted   TINYINT      NOT NULL DEFAULT 0,
  KEY idx_family_rule_genealogy (genealogy_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='家规家训';

CREATE TABLE version_snapshot (
  id                  BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  genealogy_id        BIGINT       NOT NULL,
  project_id          BIGINT       NOT NULL,
  batch_no            INT          NOT NULL,
  version_name        VARCHAR(128) NOT NULL,
  layout_type         VARCHAR(32)  NOT NULL,
  total_persons       INT          NOT NULL DEFAULT 0,
  total_pages         INT          NOT NULL DEFAULT 0,
  summary             TEXT         NULL,
  archive_user_id     BIGINT       NOT NULL,
  pdf_file_id         BIGINT       NULL,
  data_snapshot_path  VARCHAR(512) NOT NULL,
  is_archived         TINYINT      NOT NULL DEFAULT 0,
  created_at          DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  archived_at         DATETIME(3)  NULL,
  KEY idx_snapshot_genealogy (genealogy_id),
  KEY idx_snapshot_project (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='版本快照';

CREATE TABLE attachment (
  id              BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  genealogy_id    BIGINT       NOT NULL,
  project_id      BIGINT       NULL,
  file_name       VARCHAR(256) NOT NULL,
  file_type       VARCHAR(32)  NOT NULL,
  file_ext        VARCHAR(16)  NOT NULL,
  file_size       BIGINT       NOT NULL,
  storage_path    VARCHAR(512) NOT NULL,
  thumbnail_path  VARCHAR(512) NULL,
  attachment_type VARCHAR(32)  NOT NULL,
  metadata        JSON         NULL,
  bind_person_id  BIGINT       NULL,
  upload_user_id  BIGINT       NOT NULL,
  created_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  is_deleted      TINYINT      NOT NULL DEFAULT 0,
  deleted_at      DATETIME(3)  NULL,
  KEY idx_att_genealogy_type (genealogy_id, attachment_type),
  KEY idx_att_project (project_id),
  KEY idx_att_person (bind_person_id),
  KEY idx_att_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='附件元数据';

CREATE TABLE share_link (
  id           BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  genealogy_id BIGINT       NOT NULL,
  token        VARCHAR(64)  NOT NULL,
  created_by   BIGINT       NOT NULL,
  expire_at    DATETIME(3)  NULL,
  revoked_at   DATETIME(3)  NULL,
  created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_share_token (token),
  KEY idx_share_genealogy (genealogy_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='只读分享链';

CREATE TABLE operation_log (
  id               BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  genealogy_id     BIGINT       NULL,
  project_id       BIGINT       NULL,
  operator_user_id BIGINT       NULL,
  admin_user_id    BIGINT       NULL,
  log_category     VARCHAR(32)  NOT NULL,
  action           VARCHAR(64)  NOT NULL,
  target_type      VARCHAR(32)  NULL,
  target_id        BIGINT       NULL,
  change_summary   VARCHAR(512) NULL,
  change_detail    JSON         NULL,
  ip_address       VARCHAR(64)  NOT NULL,
  user_agent       VARCHAR(256) NULL,
  created_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_oplog_genealogy_cat_time (genealogy_id, log_category, created_at),
  KEY idx_oplog_operator_time (operator_user_id, created_at),
  KEY idx_oplog_admin_time (admin_user_id, created_at),
  KEY idx_oplog_target (target_type, target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='操作日志只增';

CREATE TABLE async_task (
  id           BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  task_type    VARCHAR(32)  NOT NULL COMMENT 'pdf/import/snapshot等',
  genealogy_id BIGINT       NULL,
  project_id   BIGINT       NULL,
  status       TINYINT      NOT NULL DEFAULT 0 COMMENT '0待处理 1进行中 2成功 3失败',
  result_path  VARCHAR(512) NULL,
  error_msg    VARCHAR(512) NULL,
  created_by   BIGINT       NOT NULL,
  created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_task_status (status, created_at),
  KEY idx_task_genealogy (genealogy_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='异步任务';
