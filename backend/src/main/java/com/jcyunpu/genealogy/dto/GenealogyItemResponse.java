package com.jcyunpu.genealogy.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class GenealogyItemResponse {
  private Long id;
  private String genealogyNo;
  private String name;
  private String surname;
  private String hallName;
  private String ancestor;
  private Integer privacy;
  private Integer livingDesensitize;
  private String mode;
  private Integer personCount;
  private Integer attachmentCount;
  private Integer projectCount;
  private Integer currentStage;
  private Integer stageSchema;
  private Integer layoutDirty;
  private Long ownerUserId;
  /** owner | collaborator | member */
  private String membership;
  private String createdAt;
  private String updatedAt;
  private String deletedAt;
}
