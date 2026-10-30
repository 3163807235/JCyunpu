package com.jcyunpu.common.security;

import java.time.Duration;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TokenBlacklistService {

  private static final String PREFIX = "auth:bl:";

  private final StringRedisTemplate redis;

  public void blacklist(String jti, Duration ttl) {
    if (jti == null || jti.isBlank() || ttl.isNegative() || ttl.isZero()) {
      return;
    }
    redis.opsForValue().set(PREFIX + jti, "1", ttl);
  }

  public boolean isBlacklisted(String jti) {
    if (jti == null || jti.isBlank()) {
      return false;
    }
    Boolean has = redis.hasKey(PREFIX + jti);
    return Boolean.TRUE.equals(has);
  }
}
