package com.jcyunpu.member.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class InviteCodeResponse {
  private Long id;
  private Long genealogyId;
  private String code;
  private Integer status;
  private Integer maxUses;
  private Integer usedCount;
  private String expireAt;
  private Long createdBy;
  private String createdAt;
  private String revokedAt;
}
