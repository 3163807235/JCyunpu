package com.jcyunpu.person.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("person")
public class Person {
  @TableId(type = IdType.AUTO)
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
  private Integer isYoushang;
  private String nativePlace;
  private String burialPlace;
  private String biography;
  private Integer privacyLevel;
  private String sourcePersonNo;
  private Integer isChangedSinceArchive;
  private Integer reviewStatus;
  private String reviewNote;
  private Integer zibeiDoubt;
  private Long createdBy;
  private Long updatedBy;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
  private Integer isDeleted;
  private LocalDateTime deletedAt;
}
