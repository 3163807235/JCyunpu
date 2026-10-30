package com.jcyunpu.subscription.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.jcyunpu.common.context.UserContext;
import com.jcyunpu.common.exception.BizException;
import com.jcyunpu.common.util.DateTimes;
import com.jcyunpu.quota.service.QuotaService;
import com.jcyunpu.subscription.catalog.PlanCatalog;
import com.jcyunpu.subscription.dto.AutoRenewRequest;
import com.jcyunpu.subscription.dto.ExpandPackResponse;
import com.jcyunpu.subscription.dto.PlanOptionResponse;
import com.jcyunpu.subscription.dto.SubscriptionSummaryResponse;
import com.jcyunpu.subscription.entity.Subscription;
import com.jcyunpu.subscription.mapper.SubscriptionMapper;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SubscriptionService {

  private static final Map<String, String> PLAN_NAMES =
      Map.of(
          "trial", "试用套餐",
          "basic", "基础年付",
          "professional", "专业年付");

  private final SubscriptionMapper subscriptionMapper;
  private final QuotaService quotaService;

  public SubscriptionSummaryResponse summary() {
    Long tenantId = UserContext.getTenantId();
    if (tenantId == null) {
      throw new BizException(401, "未登录");
    }
    Subscription sub = latestSubscription(tenantId);
    if (sub == null) {
      throw new BizException(22001, "无有效订阅");
    }
    return toSummary(sub, tenantId);
  }

  public List<PlanOptionResponse> plans() {
    requireTenantId();
    return PlanCatalog.PLANS;
  }

  public List<ExpandPackResponse> expandPacks() {
    Long tenantId = requireTenantId();
    Subscription sub = latestSubscription(tenantId);
    if (sub == null) {
      return Collections.emptyList();
    }
    boolean expired =
        sub.getExpireDate() != null && sub.getExpireDate().isBefore(LocalDateTime.now());
    boolean inactive = sub.getStatus() == null || sub.getStatus() != 1;
    if (expired || inactive || "trial".equalsIgnoreCase(sub.getPlanType())) {
      return Collections.emptyList();
    }
    return PlanCatalog.EXPAND_PACKS;
  }

  @Transactional
  public SubscriptionSummaryResponse setAutoRenew(AutoRenewRequest req) {
    Long tenantId = requireTenantId();
    Subscription sub = quotaService.requireActiveSubscription(tenantId);
    if ("trial".equalsIgnoreCase(sub.getPlanType())) {
      throw new BizException(22017, "试用套餐不支持自动续费");
    }
    sub.setAutoRenew(Boolean.TRUE.equals(req.getAutoRenew()) ? 1 : 0);
    sub.setUpdatedAt(LocalDateTime.now());
    if (subscriptionMapper.updateById(sub) != 1) {
      throw new BizException(22004, "自动续费设置失败，请重试");
    }
    return toSummary(sub, tenantId);
  }

  private SubscriptionSummaryResponse toSummary(Subscription sub, Long tenantId) {
    boolean expired =
        sub.getExpireDate() != null && sub.getExpireDate().isBefore(LocalDateTime.now());
    boolean inactive = sub.getStatus() == null || sub.getStatus() != 1;
    String status;
    if (expired || inactive) {
      status = "expired";
    } else if ("trial".equalsIgnoreCase(sub.getPlanType())) {
      status = "trial";
    } else {
      status = "active";
    }

    String planType =
        sub.getPlanType() == null ? "trial" : sub.getPlanType().toLowerCase(Locale.ROOT);
    int usedFromDb = sub.getPersonUsed() == null ? 0 : sub.getPersonUsed();
    int usedCounted = quotaService.countPersonQuotaUsed(tenantId);
    // 以冗余字段为准，若漂移则以实计纠正展示（不在此写回）
    int personUsed = Math.max(usedFromDb, usedCounted);

    return SubscriptionSummaryResponse.builder()
        .status(status)
        .planType(planType)
        .planName(PLAN_NAMES.getOrDefault(planType, planType))
        .startAt(DateTimes.format(sub.getStartDate()))
        .expireAt(DateTimes.format(sub.getExpireDate()))
        .autoRenew(sub.getAutoRenew() != null && sub.getAutoRenew() == 1)
        .personUsed(personUsed)
        .personLimit(sub.getPersonQuota() == null ? 0 : sub.getPersonQuota())
        .storageUsedMb(sub.getStorageUsedMb() == null ? 0 : sub.getStorageUsedMb())
        .storageLimitMb(sub.getStorageQuotaMb() == null ? 0 : sub.getStorageQuotaMb())
        .maxGenealogyCount(sub.getMaxGenealogyCount() == null ? 1 : sub.getMaxGenealogyCount())
        .maxCollaborators(sub.getMaxCollaborators() == null ? 0 : sub.getMaxCollaborators())
        .maxContinuationCount(
            sub.getMaxContinuationCount() == null ? 0 : sub.getMaxContinuationCount())
        .continuationUsed(0)
        .ocrRemaining(0)
        .allowPdfExport(sub.getAllowPdfExport() != null && sub.getAllowPdfExport() == 1)
        .allowBatchExport(sub.getAllowBatchExport() != null && sub.getAllowBatchExport() == 1)
        .build();
  }

  private Subscription latestSubscription(Long tenantId) {
    return subscriptionMapper.selectOne(
        new LambdaQueryWrapper<Subscription>()
            .eq(Subscription::getTenantId, tenantId)
            .orderByDesc(Subscription::getExpireDate)
            .last("LIMIT 1"));
  }

  private Long requireTenantId() {
    Long tenantId = UserContext.getTenantId();
    if (tenantId == null) {
      throw new BizException(401, "未登录");
    }
    return tenantId;
  }
}
