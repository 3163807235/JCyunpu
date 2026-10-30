package com.jcyunpu.subscription.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class QuotaTransactionItemResponse {
  private Long id;
  private String quotaType;
  private String changeType;
  private Integer changeAmount;
  private Integer balanceAfter;
  private String genealogyName;
  private String operatorName;
  private String remark;
  private Long orderId;
  private String createdAt;
}
