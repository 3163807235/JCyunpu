package com.jcyunpu.member.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class InvitePreviewResponse {
  private Long genealogyId;
  private String name;
  private String surname;
  private String hallName;
  private String code;
}
