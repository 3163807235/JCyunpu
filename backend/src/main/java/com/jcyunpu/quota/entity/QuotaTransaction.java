package com.jcyunpu.quota.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("quota_transaction")
public class QuotaTransaction {
  @TableId(type = IdType.AUTO)
  private Long id;
  private Long tenantId;
  private String quotaType;
  private String changeType;
  private Integer changeAmount;
  private Integer balanceAfter;
  private Long genealogyId;
  private Long projectId;
  private Long operatorUserId;
  private Long adminUserId;
  private String remark;
  private Long orderId;
  private LocalDateTime createdAt;
}
