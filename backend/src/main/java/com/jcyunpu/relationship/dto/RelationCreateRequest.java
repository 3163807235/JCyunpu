package com.jcyunpu.relationship.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RelationCreateRequest {
  @NotNull private Long genealogyId;
  @NotNull private Long fromPersonId;
  @NotNull private Long toPersonId;
  @NotBlank private String relType;
  private String remark;
}
