package com.jcyunpu.person.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class GenerationConfigRequest {
  private String poem;

  @NotNull(message = "请设置起始世代")
  @Min(value = 1, message = "起始世代至少为 1")
  private Integer startGen;
}
