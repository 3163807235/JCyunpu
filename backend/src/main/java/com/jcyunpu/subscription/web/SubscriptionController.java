package com.jcyunpu.subscription.web;

import com.jcyunpu.common.api.ApiResponse;
import com.jcyunpu.subscription.dto.AutoRenewRequest;
import com.jcyunpu.subscription.dto.ExpandPackResponse;
import com.jcyunpu.subscription.dto.PlanOptionResponse;
import com.jcyunpu.subscription.dto.SubscriptionSummaryResponse;
import com.jcyunpu.subscription.service.SubscriptionService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/subscription")
@RequiredArgsConstructor
public class SubscriptionController {

  private final SubscriptionService subscriptionService;

  @GetMapping("/summary")
  public ApiResponse<SubscriptionSummaryResponse> summary() {
    return ApiResponse.ok(subscriptionService.summary());
  }

  @GetMapping("/plans")
  public ApiResponse<List<PlanOptionResponse>> plans() {
    return ApiResponse.ok(subscriptionService.plans());
  }

  @GetMapping("/expand-packs")
  public ApiResponse<List<ExpandPackResponse>> expandPacks() {
    return ApiResponse.ok(subscriptionService.expandPacks());
  }

  @PostMapping("/auto-renew")
  public ApiResponse<SubscriptionSummaryResponse> autoRenew(
      @Valid @RequestBody AutoRenewRequest req) {
    return ApiResponse.ok(subscriptionService.setAutoRenew(req));
  }
}
