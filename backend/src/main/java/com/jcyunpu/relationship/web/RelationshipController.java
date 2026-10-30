package com.jcyunpu.relationship.web;

import com.jcyunpu.common.api.ApiResponse;
import com.jcyunpu.relationship.dto.RelationCreateRequest;
import com.jcyunpu.relationship.dto.RelationItemResponse;
import com.jcyunpu.relationship.dto.SetFatherRequest;
import com.jcyunpu.relationship.service.RelationshipService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class RelationshipController {

  private final RelationshipService relationshipService;

  @GetMapping("/api/genealogy/{genealogyId}/relationships")
  public ApiResponse<List<RelationItemResponse>> list(@PathVariable Long genealogyId) {
    return ApiResponse.ok(relationshipService.list(genealogyId));
  }

  @PostMapping("/api/genealogy/{genealogyId}/relationships")
  public ApiResponse<List<RelationItemResponse>> create(
      @PathVariable Long genealogyId, @Valid @RequestBody RelationCreateRequest req) {
    req.setGenealogyId(genealogyId);
    return ApiResponse.ok(relationshipService.create(req));
  }

  /** 兼容前端扁平 body（含 genealogyId） */
  @PostMapping("/api/relationships")
  public ApiResponse<List<RelationItemResponse>> createFlat(
      @Valid @RequestBody RelationCreateRequest req) {
    return ApiResponse.ok(relationshipService.create(req));
  }

  @DeleteMapping("/api/genealogy/{genealogyId}/relationships/{rid}")
  public ApiResponse<Void> delete(@PathVariable Long genealogyId, @PathVariable Long rid) {
    relationshipService.delete(genealogyId, rid);
    return ApiResponse.ok();
  }

  @DeleteMapping("/api/relationships/{rid}")
  public ApiResponse<Void> deleteFlat(@PathVariable Long rid) {
    relationshipService.deleteById(rid);
    return ApiResponse.ok();
  }

  @PostMapping("/api/genealogy/{genealogyId}/relationships/set-father")
  public ApiResponse<List<RelationItemResponse>> setFather(
      @PathVariable Long genealogyId, @Valid @RequestBody SetFatherRequest req) {
    return ApiResponse.ok(
        relationshipService.setFather(
            genealogyId, req.getChildId(), req.getFatherId(), req.getRemark()));
  }
}
