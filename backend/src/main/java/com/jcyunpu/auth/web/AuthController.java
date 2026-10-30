package com.jcyunpu.auth.web;

import com.jcyunpu.auth.dto.LoginRequest;
import com.jcyunpu.auth.dto.LoginResponse;
import com.jcyunpu.auth.dto.RefreshTokenRequest;
import com.jcyunpu.auth.dto.RegisterRequest;
import com.jcyunpu.auth.dto.ResetPasswordRequest;
import com.jcyunpu.auth.dto.SendSmsRequest;
import com.jcyunpu.auth.service.AuthService;
import com.jcyunpu.auth.sms.SmsCodeService;
import com.jcyunpu.common.api.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

  private final AuthService authService;
  private final SmsCodeService smsCodeService;

  @PostMapping("/sms/send")
  public ApiResponse<Void> sendSms(@Valid @RequestBody SendSmsRequest req) {
    smsCodeService.send(req.getPhone(), req.getScene());
    return ApiResponse.ok();
  }

  @PostMapping("/register")
  public ApiResponse<Void> register(@Valid @RequestBody RegisterRequest req) {
    authService.register(req);
    return ApiResponse.ok();
  }

  @PostMapping("/login")
  public ApiResponse<LoginResponse> login(
      @RequestBody LoginRequest req, HttpServletRequest httpRequest) {
    return ApiResponse.ok(authService.login(req, clientIp(httpRequest)));
  }

  @PostMapping("/token/refresh")
  public ApiResponse<LoginResponse> refresh(@Valid @RequestBody RefreshTokenRequest req) {
    return ApiResponse.ok(authService.refresh(req.getRefreshToken()));
  }

  @PostMapping("/logout")
  public ApiResponse<Void> logout(
      HttpServletRequest httpRequest, @RequestBody(required = false) RefreshTokenRequest body) {
    String access = bearer(httpRequest);
    String refresh = body == null ? null : body.getRefreshToken();
    authService.logout(access, refresh);
    return ApiResponse.ok();
  }

  @PostMapping("/password/reset")
  public ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
    authService.resetPassword(req);
    return ApiResponse.ok();
  }

  private String bearer(HttpServletRequest request) {
    String header = request.getHeader(HttpHeaders.AUTHORIZATION);
    if (StringUtils.hasText(header) && header.startsWith("Bearer ")) {
      return header.substring(7);
    }
    return null;
  }

  private String clientIp(HttpServletRequest request) {
    String xff = request.getHeader("X-Forwarded-For");
    if (StringUtils.hasText(xff)) {
      return xff.split(",")[0].trim();
    }
    return request.getRemoteAddr();
  }
}
