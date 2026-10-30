package com.jcyunpu.person.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PersonFormRequest {
  @NotBlank(message = "请填写讳名")
  private String nameWei;

  private String nameZi;
  private String nameHao;
  private String xingdi;
  private String zibei;

  @NotNull(message = "请填写世代")
  private Integer generation;

  @NotNull(message = "请选择性别")
  private Integer gender;

  private String birthDate;
  private String deathDate;

  @NotNull(message = "请选择在世状态")
  private Integer isAlive;

  private Boolean isYoushang;
  private String nativePlace;
  private String burialPlace;
  private String biography;

  @NotNull(message = "请选择隐私级别")
  private Integer privacyLevel;

  private Boolean zibeiDoubt;
  private String personNo;
}
