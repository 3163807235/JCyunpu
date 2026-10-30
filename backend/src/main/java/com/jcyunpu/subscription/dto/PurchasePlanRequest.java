package com.jcyunpu.subscription.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PurchasePlanRequest {
  @NotBlank private String planType;
  @NotBlank private String paymentMethod;
  private Boolean autoRenew;
}
