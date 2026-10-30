package com.jcyunpu.member.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class JoinByCodeRequest {
  @NotBlank(message = "请输入族谱邀请码")
  private String code;
}
