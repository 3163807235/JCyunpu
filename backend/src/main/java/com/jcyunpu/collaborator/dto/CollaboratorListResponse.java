package com.jcyunpu.collaborator.dto;

import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CollaboratorListResponse {
  private List<CollaboratorItemResponse> list;
  /** 套餐协作人数上限（不含拥有者） */
  private Integer maxCollaborators;
  /** 已占用席位：待接受 + 已加入（不含拥有者） */
  private Integer usedSeats;
}
