package com.jcyunpu.subscription.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ExpandPackResponse {
  private String id;
  private String productType;
  private String name;
  private Integer amount;
  private Integer personAdd;
  private Integer storageAddMb;
}
