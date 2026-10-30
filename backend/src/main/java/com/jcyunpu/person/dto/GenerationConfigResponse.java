package com.jcyunpu.person.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class GenerationConfigResponse {
  private String poem;
  private Integer startGen;
}
