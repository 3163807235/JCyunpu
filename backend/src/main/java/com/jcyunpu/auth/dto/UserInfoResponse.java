package com.jcyunpu.auth.dto;

import java.util.List;
import lombok.Builder;
import lombok.Data;

/** 对齐前端 Api.Auth.UserInfo */
@Data
@Builder
public class UserInfoResponse {
  private List<String> buttons;
  private List<String> roles;
  private Long userId;
  private String userName;
  private String email;
  private String phone;
  private String avatar;
  private String nickName;
}
