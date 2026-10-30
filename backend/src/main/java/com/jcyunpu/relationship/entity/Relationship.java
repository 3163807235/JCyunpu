package com.jcyunpu.relationship.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("relationship")
public class Relationship {
  @TableId(type = IdType.AUTO)
  private Long id;
  private Long genealogyId;
  private Long fromPersonId;
  private Long toPersonId;
  private String relType;
  private Integer isPrimary;
  private String remark;
  private Long createdBy;
  private Long updatedBy;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
  private Integer isDeleted;
}
