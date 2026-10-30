package com.jcyunpu.collaborator.web;

import com.jcyunpu.collaborator.dto.CollaboratorItemResponse;
import com.jcyunpu.collaborator.dto.CollaboratorListResponse;
import com.jcyunpu.collaborator.dto.InviteCollaboratorRequest;
import com.jcyunpu.collaborator.service.CollaboratorService;
import com.jcyunpu.common.api.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/genealogy/{genealogyId}/collaborators")
@RequiredArgsConstructor
public class CollaboratorController {

  private final CollaboratorService collaboratorService;

  @GetMapping
  public ApiResponse<CollaboratorListResponse> list(@PathVariable Long genealogyId) {
    return ApiResponse.ok(collaboratorService.list(genealogyId));
  }

  @PostMapping
  public ApiResponse<CollaboratorItemResponse> invite(
      @PathVariable Long genealogyId, @Valid @RequestBody InviteCollaboratorRequest req) {
    return ApiResponse.ok(collaboratorService.invite(genealogyId, req));
  }

  /** 被邀请人接受；OpenAPI §4 未单列，P0 补齐 */
  @PostMapping("/{collaboratorId}/accept")
  public ApiResponse<CollaboratorItemResponse> accept(
      @PathVariable Long genealogyId, @PathVariable Long collaboratorId) {
    return ApiResponse.ok(collaboratorService.accept(genealogyId, collaboratorId));
  }

  @DeleteMapping("/{userId}")
  public ApiResponse<Void> remove(@PathVariable Long genealogyId, @PathVariable Long userId) {
    collaboratorService.remove(genealogyId, userId);
    return ApiResponse.ok();
  }
}
