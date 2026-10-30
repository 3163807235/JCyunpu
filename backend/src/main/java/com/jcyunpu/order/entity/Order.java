package com.jcyunpu.order.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("`order`")
public class Order {
  @TableId(type = IdType.AUTO)
  private Long id;
  private String orderNo;
  private Long tenantId;
  private Long subscriptionId;
  private String productType;
  private String productName;
  private BigDecimal amount;
  private BigDecimal originalAmount;
  private BigDecimal discountAmount;
  private String paymentMethod;
  private Integer paymentStatus;
  private LocalDateTime paidAt;
  private LocalDateTime expiredAt;
  private LocalDateTime refundedAt;
  private String refundReason;
  /** JSON 字符串，如 {"person":500,"storageMb":2048} */
  private String grantedQuota;
  private Long adminUserId;
  private Long createdBy;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}
