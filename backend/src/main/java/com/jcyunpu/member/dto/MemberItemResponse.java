package com.jcyunpu.member.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MemberItemResponse {
  private Long id;
  private Long genealogyId;
  private Long userId;
  private String displayName;
  private Integer status;
  private String joinSource;
  private String inviteCodeUsed;
  private String joinedAt;
  private String leftAt;
  private String createdAt;
  private String updatedAt;
}
