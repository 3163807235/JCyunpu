package com.jcyunpu.subscription.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PurchaseExpandRequest {
  @NotBlank private String packId;
  @NotBlank private String paymentMethod;
}
