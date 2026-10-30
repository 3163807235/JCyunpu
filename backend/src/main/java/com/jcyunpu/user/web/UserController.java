package com.jcyunpu.user.web;

import com.jcyunpu.auth.dto.UserInfoResponse;
import com.jcyunpu.auth.service.AuthService;
import com.jcyunpu.common.api.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

  private final AuthService authService;

  @GetMapping("/info")
  public ApiResponse<UserInfoResponse> info() {
    return ApiResponse.ok(authService.currentUserInfo());
  }
}
