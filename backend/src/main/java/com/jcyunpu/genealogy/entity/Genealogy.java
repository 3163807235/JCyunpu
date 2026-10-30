package com.jcyunpu.genealogy.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("genealogy")
public class Genealogy {
  @TableId(type = IdType.AUTO)
  private Long id;
  private Long tenantId;
  private String genealogyNo;
  private String name;
  private String surname;
  private String tanghao;
  private String shizuName;
  private Integer shizuGeneration;
  private String zibeiPoem;
  private Integer zibeiStartGen;
  private Integer privacyMode;
  private Integer livingDesensitize;
  private Long ownerUserId;
  private String mode;
  private Integer status;
  private LocalDateTime deletedAt;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}
