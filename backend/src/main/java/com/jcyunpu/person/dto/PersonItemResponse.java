package com.jcyunpu.person.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PersonItemResponse {
  private Long id;
  private Long genealogyId;
  private Long projectId;
  private String personNo;
  private Integer generation;
  private String nameWei;
  private String nameZi;
  private String nameHao;
  private String xingdi;
  private String zibei;
  private Integer gender;
  private String birthDate;
  private String deathDate;
  private Integer isAlive;
  private Boolean isYoushang;
  private String nativePlace;
  private String burialPlace;
  private String biography;
  private Integer privacyLevel;
  private Integer reviewStatus;
  private String reviewNote;
  private Integer isChangedSinceArchive;
  private Boolean zibeiDoubt;
  private String createdAt;
  private String updatedAt;
  private String deletedAt;
}
