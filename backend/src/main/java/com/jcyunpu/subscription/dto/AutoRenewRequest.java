package com.jcyunpu.subscription.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AutoRenewRequest {
  @NotNull private Boolean autoRenew;
}
