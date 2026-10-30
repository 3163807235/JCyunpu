package com.jcyunpu.member.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("genealogy_invite_code")
public class GenealogyInviteCode {
  @TableId(type = IdType.AUTO)
  private Long id;
  private Long genealogyId;
  private String code;
  private Integer status;
  private Integer maxUses;
  private Integer usedCount;
  private LocalDateTime expireAt;
  private Long createdBy;
  private LocalDateTime createdAt;
  private LocalDateTime revokedAt;
}
