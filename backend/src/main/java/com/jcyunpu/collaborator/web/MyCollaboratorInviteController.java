package com.jcyunpu.collaborator.web;

import com.jcyunpu.collaborator.dto.CollaboratorItemResponse;
import com.jcyunpu.collaborator.dto.MyCollaboratorInviteResponse;
import com.jcyunpu.collaborator.service.CollaboratorService;
import com.jcyunpu.common.api.ApiResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** 当前用户收到的协作邀请（B 侧入口） */
@RestController
@RequestMapping("/api/user/collaborator-invites")
@RequiredArgsConstructor
public class MyCollaboratorInviteController {

  private final CollaboratorService collaboratorService;

  @GetMapping
  public ApiResponse<List<MyCollaboratorInviteResponse>> listMine() {
    return ApiResponse.ok(collaboratorService.listMyPendingInvites());
  }

  @PostMapping("/{id}/accept")
  public ApiResponse<CollaboratorItemResponse> accept(@PathVariable Long id) {
    return ApiResponse.ok(collaboratorService.acceptMine(id));
  }

  @PostMapping("/{id}/reject")
  public ApiResponse<Void> reject(@PathVariable Long id) {
    collaboratorService.rejectMine(id);
    return ApiResponse.ok();
  }
}
