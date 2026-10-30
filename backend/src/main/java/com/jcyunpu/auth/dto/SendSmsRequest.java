package com.jcyunpu.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SendSmsRequest {
  @NotBlank(message = "手机号不能为空")
  private String phone;
  /** login | register | reset */
  private String scene;
}
