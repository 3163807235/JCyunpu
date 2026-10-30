package com.jcyunpu.member.web;

import com.jcyunpu.common.api.ApiResponse;
import com.jcyunpu.common.context.UserContext;
import com.jcyunpu.member.dto.InviteCodeResponse;
import com.jcyunpu.member.dto.InvitePreviewResponse;
import com.jcyunpu.member.dto.JoinByCodeRequest;
import com.jcyunpu.member.dto.MemberItemResponse;
import com.jcyunpu.member.service.InviteCodeService;
import com.jcyunpu.member.service.MemberService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/genealogy")
@RequiredArgsConstructor
public class MemberController {

  private final InviteCodeService inviteCodeService;
  private final MemberService memberService;

  @GetMapping("/invite-codes/preview")
  public ApiResponse<InvitePreviewResponse> preview(@RequestParam String code) {
    return ApiResponse.ok(inviteCodeService.preview(code));
  }

  @PostMapping("/members/join")
  public ApiResponse<Void> join(@Valid @RequestBody JoinByCodeRequest req) {
    memberService.joinByCode(req.getCode());
    return ApiResponse.ok();
  }

  @GetMapping("/{id}/invite-code")
  public ApiResponse<InviteCodeResponse> inviteCode(@PathVariable("id") Long genealogyId) {
    return ApiResponse.ok(
        inviteCodeService.getActiveForOwner(genealogyId, UserContext.getUserId()));
  }

  @PostMapping("/{id}/invite-code/rotate")
  public ApiResponse<InviteCodeResponse> rotate(@PathVariable("id") Long genealogyId) {
    return ApiResponse.ok(inviteCodeService.rotate(genealogyId, UserContext.getUserId()));
  }

  @GetMapping("/{id}/members")
  public ApiResponse<List<MemberItemResponse>> members(@PathVariable("id") Long genealogyId) {
    return ApiResponse.ok(memberService.list(genealogyId));
  }

  @DeleteMapping("/{id}/members/{userId}")
  public ApiResponse<Void> remove(
      @PathVariable("id") Long genealogyId, @PathVariable Long userId) {
    memberService.remove(genealogyId, userId);
    return ApiResponse.ok();
  }

  @PostMapping("/{id}/members/leave")
  public ApiResponse<Void> leave(@PathVariable("id") Long genealogyId) {
    memberService.leave(genealogyId);
    return ApiResponse.ok();
  }
}
