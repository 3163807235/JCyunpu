package com.jcyunpu.subscription.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SubscriptionSummaryResponse {
  private String status;
  private String planType;
  private String planName;
  private String startAt;
  private String expireAt;
  private Boolean autoRenew;
  private Integer personUsed;
  private Integer personLimit;
  private Integer storageUsedMb;
  private Integer storageLimitMb;
  private Integer maxGenealogyCount;
  private Integer maxCollaborators;
  private Integer maxContinuationCount;
  private Integer continuationUsed;
  private Integer ocrRemaining;
  private Boolean allowPdfExport;
  private Boolean allowBatchExport;
}
