package com.jcyunpu.subscription.dto;

import java.util.Map;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OrderItemResponse {
  private Long id;
  private String orderNo;
  private String productType;
  private String productName;
  private Double amount;
  private String paymentMethod;
  private Integer paymentStatus;
  private String paidAt;
  private String createdAt;
  private Map<String, Integer> grantedQuota;
}
