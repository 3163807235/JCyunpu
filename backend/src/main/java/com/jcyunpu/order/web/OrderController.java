package com.jcyunpu.order.web;

import com.jcyunpu.common.api.ApiResponse;
import com.jcyunpu.common.api.PageResult;
import com.jcyunpu.order.dto.CreateOrderRequest;
import com.jcyunpu.order.service.OrderService;
import com.jcyunpu.subscription.dto.OrderItemResponse;
import com.jcyunpu.subscription.dto.PurchaseExpandRequest;
import com.jcyunpu.subscription.dto.PurchasePlanRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

  private final OrderService orderService;

  @PostMapping
  public ApiResponse<OrderItemResponse> create(@Valid @RequestBody CreateOrderRequest req) {
    if (StringUtils.hasText(req.getPlanType())) {
      PurchasePlanRequest plan = new PurchasePlanRequest();
      plan.setPlanType(req.getPlanType());
      plan.setPaymentMethod(req.getPaymentMethod());
      plan.setAutoRenew(req.getAutoRenew());
      return ApiResponse.ok(orderService.purchasePlan(plan));
    }
    PurchaseExpandRequest expand = new PurchaseExpandRequest();
    expand.setPackId(req.getPackId());
    expand.setPaymentMethod(req.getPaymentMethod());
    return ApiResponse.ok(orderService.purchaseExpand(expand));
  }

  @GetMapping
  public ApiResponse<PageResult<OrderItemResponse>> list(
      @RequestParam(defaultValue = "1") long current,
      @RequestParam(defaultValue = "10") long size,
      @RequestParam(required = false) Integer paymentStatus) {
    return ApiResponse.ok(orderService.listOrders(current, size, paymentStatus));
  }

  @GetMapping("/{orderNo}")
  public ApiResponse<OrderItemResponse> detail(@PathVariable String orderNo) {
    return ApiResponse.ok(orderService.detail(orderNo));
  }
}
