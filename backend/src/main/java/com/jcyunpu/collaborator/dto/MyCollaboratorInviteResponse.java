package com.jcyunpu.collaborator.dto;

import lombok.Builder;
import lombok.Data;

/** 被邀请人视角的待处理协作邀请 · 产品 §3.4 页面 14 / 旅程二 */
@Data
@Builder
public class MyCollaboratorInviteResponse {
  private Long id;
  private Long genealogyId;
  private String genealogyName;
  private String genealogyNo;
  private String surname;
  private String role;
  private Integer inviteStatus;
  private String inviteToken;
  private Long invitedBy;
  private String inviterName;
  private String invitedAt;
  private String expireAt;
}
