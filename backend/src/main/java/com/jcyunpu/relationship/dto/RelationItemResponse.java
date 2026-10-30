package com.jcyunpu.relationship.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RelationItemResponse {
  private Long id;
  private Long genealogyId;
  private Long fromPersonId;
  private Long toPersonId;
  private String relType;
  private String remark;
  private String createdAt;
  private String deletedAt;
}
