package com.jcyunpu.subscription.catalog;

import com.jcyunpu.subscription.dto.ExpandPackResponse;
import com.jcyunpu.subscription.dto.PlanOptionResponse;
import java.util.List;
import java.util.Optional;

/** 套餐/扩容包目录 · 对齐产品 §0.8 与前端 Mock PLAN_CATALOG */
public final class PlanCatalog {

  private PlanCatalog() {}

  public static final List<PlanOptionResponse> PLANS =
      List.of(
          PlanOptionResponse.builder()
              .planType("trial")
              .name("试用套餐")
              .price(0)
              .durationDays(30)
              .personQuota(50)
              .storageQuotaMb(100)
              .maxCollaborators(1)
              .maxContinuationCount(0)
              .maxGenealogyCount(1)
              .allowPdfExport(false)
              .allowBatchExport(false)
              .ocrMonthly(5)
              .features(List.of("30 天试用", "50 人 / 100MB", "牒记式预览（含水印）", "不可批量导入"))
              .build(),
          PlanOptionResponse.builder()
              .planType("basic")
              .name("基础年付")
              .price(299)
              .durationDays(365)
              .personQuota(500)
              .storageQuotaMb(2048)
              .maxCollaborators(5)
              .maxContinuationCount(3)
              .maxGenealogyCount(1)
              .allowPdfExport(true)
              .allowBatchExport(true)
              .ocrMonthly(50)
              .features(List.of("500 人 / 2GB", "印刷版 PDF", "Excel 批量导入", "续修 3 次", "可购扩容包"))
              .build(),
          PlanOptionResponse.builder()
              .planType("professional")
              .name("专业年付")
              .price(899)
              .durationDays(365)
              .personQuota(3000)
              .storageQuotaMb(10240)
              .maxCollaborators(20)
              .maxContinuationCount(-1)
              .maxGenealogyCount(1)
              .allowPdfExport(true)
              .allowBatchExport(true)
              .ocrMonthly(-1)
              .features(List.of("3000 人 / 10GB", "印刷版 PDF + 批量导出", "续修无限", "可购扩容包", "1对1 客服"))
              .build());

  public static final List<ExpandPackResponse> EXPAND_PACKS =
      List.of(
          ExpandPackResponse.builder()
              .id("person_100")
              .productType("person_expand")
              .name("人物扩容包 100 人")
              .amount(49)
              .personAdd(100)
              .storageAddMb(0)
              .build(),
          ExpandPackResponse.builder()
              .id("person_500")
              .productType("person_expand")
              .name("人物扩容包 500 人")
              .amount(199)
              .personAdd(500)
              .storageAddMb(0)
              .build(),
          ExpandPackResponse.builder()
              .id("storage_5g")
              .productType("storage_expand")
              .name("存储扩容包 5GB")
              .amount(49)
              .personAdd(0)
              .storageAddMb(5120)
              .build());

  public static Optional<PlanOptionResponse> findPlan(String planType) {
    if (planType == null) {
      return Optional.empty();
    }
    return PLANS.stream().filter(p -> planType.equalsIgnoreCase(p.getPlanType())).findFirst();
  }

  public static Optional<ExpandPackResponse> findPack(String packId) {
    if (packId == null) {
      return Optional.empty();
    }
    return EXPAND_PACKS.stream().filter(p -> packId.equals(p.getId())).findFirst();
  }
}
