package com.jcyunpu.collaborator.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class InviteCollaboratorRequest {
  @NotBlank
  @Pattern(regexp = "^1\\d{10}$", message = "手机号格式不正确")
  private String phone;

  private String displayName;

  /** MVP 仅 editor；缺省 editor */
  private String role;
}
