package com.jcyunpu.relationship.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SetFatherRequest {
  @NotNull private Long childId;
  @NotNull private Long fatherId;
  private String remark;
}
