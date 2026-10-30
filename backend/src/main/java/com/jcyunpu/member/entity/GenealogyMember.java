package com.jcyunpu.member.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("genealogy_member")
public class GenealogyMember {
  @TableId(type = IdType.AUTO)
  private Long id;
  private Long genealogyId;
  private Long userId;
  private String displayName;
  private Integer status;
  private String joinSource;
  private String inviteCodeUsed;
  private LocalDateTime joinedAt;
  private LocalDateTime leftAt;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}
