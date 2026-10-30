package com.jcyunpu.order.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.util.StringUtils;

@Data
public class CreateOrderRequest {
  /** 购买套餐/续费时必填 */
  private String planType;
  /** 购买扩容包时必填 */
  private String packId;
  @NotBlank private String paymentMethod;
  private Boolean autoRenew;

  @AssertTrue(message = "请指定 planType 或 packId 之一")
  public boolean isTargetValid() {
    boolean plan = StringUtils.hasText(planType);
    boolean pack = StringUtils.hasText(packId);
    return plan ^ pack;
  }
}
