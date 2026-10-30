package com.jcyunpu.genealogy.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateGenealogyRequest {
  @NotBlank(message = "请填写族谱名称")
  private String name;

  @NotBlank(message = "请填写姓氏")
  private String surname;

  private String hallName;
  private String ancestor;

  @NotNull(message = "请选择隐私级别")
  private Integer privacy;

  private Integer livingDesensitize;

  @NotBlank(message = "请选择修谱模式")
  private String mode;
}
