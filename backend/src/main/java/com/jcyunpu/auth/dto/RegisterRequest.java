package com.jcyunpu.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
  @NotBlank(message = "手机号不能为空")
  private String phone;
  @NotBlank(message = "验证码不能为空")
  private String smsCode;
  @NotBlank(message = "密码不能为空")
  @Size(min = 6, max = 64, message = "密码长度需 6-64 位")
  private String password;
  /** 族谱成员邀请码（选填） */
  private String inviteCode;
}
