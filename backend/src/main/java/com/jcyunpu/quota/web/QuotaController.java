package com.jcyunpu.quota.web;

import com.jcyunpu.common.api.ApiResponse;
import com.jcyunpu.common.api.PageResult;
import com.jcyunpu.quota.service.QuotaQueryService;
import com.jcyunpu.subscription.dto.QuotaTransactionItemResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/quota")
@RequiredArgsConstructor
public class QuotaController {

  private final QuotaQueryService quotaQueryService;

  @GetMapping("/transactions")
  public ApiResponse<PageResult<QuotaTransactionItemResponse>> transactions(
      @RequestParam(defaultValue = "1") long current,
      @RequestParam(defaultValue = "10") long size,
      @RequestParam(required = false) String quotaType,
      @RequestParam(required = false) String changeType) {
    return ApiResponse.ok(quotaQueryService.listTransactions(current, size, quotaType, changeType));
  }
}
