package com.jcyunpu.collaborator.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("collaborator")
public class Collaborator {
  @TableId(type = IdType.AUTO)
  private Long id;
  private Long genealogyId;
  private Long userId;
  private String role;
  private Integer inviteStatus;
  private String inviteToken;
  private Long invitedBy;
  private LocalDateTime invitedAt;
  private LocalDateTime joinedAt;
  private LocalDateTime expireAt;
  private String branchScope;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}
