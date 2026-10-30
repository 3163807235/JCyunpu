package com.jcyunpu.genealogy.dto;

import lombok.Data;

@Data
public class UpdateGenealogyRequest {
  private String name;
  private String surname;
  private String hallName;
  private String ancestor;
  private Integer privacy;
  private Integer livingDesensitize;
  /** 仅允许 simple → standard */
  private String mode;
}
