package com.jcyunpu.tenant.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("tenant")
public class Tenant {
  @TableId(type = IdType.AUTO)
  private Long id;
  private String tenantName;
  private Integer tenantType;
  private Integer status;
  private String frozenReason;
  private LocalDateTime frozenAt;
  private String registerSource;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}
