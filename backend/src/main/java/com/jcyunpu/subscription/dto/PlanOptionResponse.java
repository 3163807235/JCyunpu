package com.jcyunpu.subscription.dto;

import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PlanOptionResponse {
  private String planType;
  private String name;
  private Integer price;
  private Integer durationDays;
  private Integer personQuota;
  private Integer storageQuotaMb;
  private Integer maxCollaborators;
  private Integer maxContinuationCount;
  private Integer maxGenealogyCount;
  private Boolean allowPdfExport;
  private Boolean allowBatchExport;
  private Integer ocrMonthly;
  private List<String> features;
}
