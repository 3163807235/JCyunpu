package com.jcyunpu.auth.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.jcyunpu.auth.dto.LoginRequest;
import com.jcyunpu.auth.dto.LoginResponse;
import com.jcyunpu.auth.dto.RegisterRequest;
import com.jcyunpu.auth.dto.ResetPasswordRequest;
import com.jcyunpu.auth.dto.UserInfoResponse;
import com.jcyunpu.auth.sms.SmsCodeService;
import com.jcyunpu.common.config.JcyunpuProperties;
import com.jcyunpu.common.context.UserContext;
import com.jcyunpu.common.exception.BizException;
import com.jcyunpu.common.security.JwtService;
import com.jcyunpu.common.security.TokenBlacklistService;
import com.jcyunpu.member.service.InviteJoinService;
import com.jcyunpu.subscription.entity.Subscription;
import com.jcyunpu.subscription.mapper.SubscriptionMapper;
import com.jcyunpu.tenant.entity.Tenant;
import com.jcyunpu.tenant.mapper.TenantMapper;
import com.jcyunpu.user.entity.UserAccount;
import com.jcyunpu.user.mapper.UserAccountMapper;
import io.jsonwebtoken.Claims;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class AuthService {

  private final UserAccountMapper userMapper;
  private final TenantMapper tenantMapper;
  private final SubscriptionMapper subscriptionMapper;
  private final SmsCodeService smsCodeService;
  private final InviteJoinService inviteJoinService;
  private final JwtService jwtService;
  private final TokenBlacklistService blacklistService;
  private final PasswordEncoder passwordEncoder;
  private final JcyunpuProperties properties;

  @Transactional
  public void register(RegisterRequest req) {
    smsCodeService.verifyOrThrow(req.getPhone(), "register", req.getSmsCode());
    Long exists =
        userMapper.selectCount(
            new LambdaQueryWrapper<UserAccount>().eq(UserAccount::getPhone, req.getPhone()));
    if (exists != null && exists > 0) {
      throw new BizException(20010, "该手机号已注册");
    }

    // 有邀请码则先校验（失败整单失败）· 成员专题 §7.1
    if (StringUtils.hasText(req.getInviteCode())) {
      // 预检：通过 join 会在 user 创建后执行；此处仅校验码存在性由 joinByCode 统一抛错
    }

    LocalDateTime now = LocalDateTime.now();
    Tenant tenant = new Tenant();
    tenant.setTenantName("用户" + req.getPhone().substring(7));
    tenant.setTenantType(1);
    tenant.setStatus(1);
    tenant.setRegisterSource(StringUtils.hasText(req.getInviteCode()) ? "invite" : "web");
    tenant.setCreatedAt(now);
    tenant.setUpdatedAt(now);
    tenantMapper.insert(tenant);

    UserAccount user = new UserAccount();
    user.setTenantId(tenant.getId());
    user.setPhone(req.getPhone());
    user.setNickname(tenant.getTenantName());
    user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
    user.setIsPrimary(1);
    user.setStatus(1);
    user.setRoles("R_USER");
    user.setCreatedAt(now);
    user.setUpdatedAt(now);
    userMapper.insert(user);

    createTrialSubscription(tenant.getId(), now);

    if (StringUtils.hasText(req.getInviteCode())) {
      inviteJoinService.joinByCode(user.getId(), req.getInviteCode(), "register_invite");
    }
  }

  public LoginResponse login(LoginRequest req, String clientIp) {
    boolean smsLogin = "sms".equalsIgnoreCase(req.getLoginType());
    UserAccount user;
    if (smsLogin) {
      if (!StringUtils.hasText(req.getPhone()) || !StringUtils.hasText(req.getSmsCode())) {
        throw new BizException(20011, "请输入手机号和验证码");
      }
      smsCodeService.verifyOrThrow(req.getPhone(), "login", req.getSmsCode());
      user = findByPhone(req.getPhone());
    } else {
      String account = StringUtils.hasText(req.getUserName()) ? req.getUserName() : req.getPhone();
      if (!StringUtils.hasText(account) || !StringUtils.hasText(req.getPassword())) {
        throw new BizException(20012, "请输入账号和密码");
      }
      user = findByPhone(account);
      if (!StringUtils.hasText(user.getPasswordHash())
          || !passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
        throw new BizException(20013, "账号或密码错误");
      }
    }
    assertUserActive(user);
    touchLogin(user, clientIp);
    return issueTokens(user);
  }

  public LoginResponse refresh(String refreshToken) {
    Claims claims;
    try {
      claims = jwtService.parseRefresh(refreshToken);
    } catch (Exception e) {
      throw new BizException(20020, "刷新令牌无效");
    }
    if (!"refresh".equals(claims.get("typ", String.class))) {
      throw new BizException(20020, "刷新令牌无效");
    }
    if (blacklistService.isBlacklisted(claims.getId())) {
      throw new BizException(20021, "刷新令牌已失效");
    }
    Long userId = Long.valueOf(claims.getSubject());
    UserAccount user = userMapper.selectById(userId);
    if (user == null) {
      // 库已重建 / 账号已删：令牌失效，前端按 401 清登录态
      throw new BizException(401, "登录已失效，请重新登录");
    }
    assertUserActive(user);
    // 轮换：拉黑旧 refresh
    Instant exp = claims.getExpiration().toInstant();
    Duration ttl = Duration.between(Instant.now(), exp);
    blacklistService.blacklist(claims.getId(), ttl.isNegative() ? Duration.ofSeconds(1) : ttl);
    return issueTokens(user);
  }

  public void logout(String accessToken, String refreshToken) {
    blacklistTokenQuietly(accessToken, true);
    blacklistTokenQuietly(refreshToken, false);
  }

  @Transactional
  public void resetPassword(ResetPasswordRequest req) {
    smsCodeService.verifyOrThrow(req.getPhone(), "reset", req.getSmsCode());
    UserAccount user = findByPhone(req.getPhone());
    user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
    user.setUpdatedAt(LocalDateTime.now());
    userMapper.updateById(user);
  }

  public UserInfoResponse currentUserInfo() {
    Long userId = UserContext.getUserId();
    if (userId == null) {
      throw new BizException(401, "未登录");
    }
    UserAccount user = userMapper.selectById(userId);
    if (user == null) {
      // 旧 JWT 对应的用户已不在库（开发期重建库常见）→ 401 触发前端登出
      throw new BizException(401, "登录已失效，请重新登录");
    }
    return UserInfoResponse.builder()
        .buttons(List.of())
        .roles(parseRoles(user.getRoles()))
        .userId(user.getId())
        .userName(user.getNickname())
        .email("")
        .phone(user.getPhone())
        .avatar(user.getAvatarUrl() == null ? "" : user.getAvatarUrl())
        .nickName(user.getNickname())
        .build();
  }

  private LoginResponse issueTokens(UserAccount user) {
    var pair = jwtService.issue(user.getId(), user.getTenantId(), parseRoles(user.getRoles()));
    return new LoginResponse(pair.accessToken(), pair.refreshToken());
  }

  private void createTrialSubscription(Long tenantId, LocalDateTime now) {
    // 产品 §0.8 试用：30天 / 50人 / 100MB / 协作1 / 续修0 / 不可 PDF
    Subscription sub = new Subscription();
    sub.setTenantId(tenantId);
    sub.setPlanType("trial");
    sub.setStatus(1);
    sub.setStartDate(now);
    sub.setExpireDate(now.plusDays(30));
    sub.setAutoRenew(0);
    sub.setPersonQuota(50);
    sub.setStorageQuotaMb(100);
    sub.setPersonUsed(0);
    sub.setStorageUsedMb(0);
    sub.setMaxCollaborators(1);
    sub.setMaxContinuationCount(0);
    sub.setMaxGenealogyCount(1);
    sub.setAllowPdfExport(0);
    sub.setAllowBatchExport(0);
    sub.setVersion(0L);
    sub.setCreatedAt(now);
    sub.setUpdatedAt(now);
    subscriptionMapper.insert(sub);
  }

  private UserAccount findByPhone(String phone) {
    UserAccount user =
        userMapper.selectOne(
            new LambdaQueryWrapper<UserAccount>().eq(UserAccount::getPhone, phone).last("LIMIT 1"));
    if (user == null) {
      throw new BizException(20014, "用户不存在");
    }
    return user;
  }

  private void assertUserActive(UserAccount user) {
    if (user.getStatus() != null && user.getStatus() != 1) {
      throw new BizException(20015, "账号已禁用");
    }
    Tenant tenant = tenantMapper.selectById(user.getTenantId());
    if (tenant != null && tenant.getStatus() != null && tenant.getStatus() == 2) {
      throw new BizException(20016, "租户已冻结");
    }
  }

  private void touchLogin(UserAccount user, String ip) {
    user.setLastLoginAt(LocalDateTime.now());
    user.setLastLoginIp(ip);
    user.setUpdatedAt(LocalDateTime.now());
    userMapper.updateById(user);
  }

  private List<String> parseRoles(String roles) {
    if (!StringUtils.hasText(roles)) {
      return List.of("R_USER");
    }
    return Arrays.stream(roles.split(",")).map(String::trim).filter(StringUtils::hasText).toList();
  }

  private void blacklistTokenQuietly(String token, boolean access) {
    if (!StringUtils.hasText(token)) {
      return;
    }
    try {
      Claims claims = access ? jwtService.parseAccess(token) : jwtService.parseRefresh(token);
      Instant exp = claims.getExpiration().toInstant();
      Duration ttl = Duration.between(Instant.now(), exp);
      blacklistService.blacklist(claims.getId(), ttl.isNegative() ? Duration.ofSeconds(1) : ttl);
    } catch (Exception ignored) {
      // 登出幂等
    }
  }
}
