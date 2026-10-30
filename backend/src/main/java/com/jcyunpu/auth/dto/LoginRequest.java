package com.jcyunpu.auth.dto;

import lombok.Data;

@Data
public class LoginRequest {
  private String userName;
  private String password;
  private String phone;
  private String smsCode;
  /** password | sms */
  private String loginType;
}
