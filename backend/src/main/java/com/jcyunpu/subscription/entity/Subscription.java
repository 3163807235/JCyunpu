package com.jcyunpu.subscription.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.Version;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("subscription")
public class Subscription {
  @TableId(type = IdType.AUTO)
  private Long id;
  private Long tenantId;
  private String planType;
  private Integer status;
  private LocalDateTime startDate;
  private LocalDateTime expireDate;
  private Integer autoRenew;
  private String autoRenewMethod;
  private Integer personQuota;
  private Integer storageQuotaMb;
  private Integer personUsed;
  private Integer storageUsedMb;
  private Integer maxCollaborators;
  private Integer maxContinuationCount;
  private Integer maxGenealogyCount;
  private Integer allowPdfExport;
  private Integer allowBatchExport;
  private Long orderId;
  @Version
  private Long version;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}
