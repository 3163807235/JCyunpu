package com.jcyunpu.collaborator.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CollaboratorItemResponse {
  private Long id;
  private Long genealogyId;
  private Long userId;
  private String displayName;
  private String phone;
  private String role;
  private Integer inviteStatus;
  private String inviteToken;
  private Long invitedBy;
  private String invitedAt;
  private String joinedAt;
  private String expireAt;
  private String createdAt;
  private String updatedAt;
}
