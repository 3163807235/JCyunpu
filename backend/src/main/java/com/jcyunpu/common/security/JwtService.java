package com.jcyunpu.common.security;

import com.jcyunpu.common.config.JcyunpuProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.UUID;
import javax.crypto.SecretKey;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class JwtService {

  private final JcyunpuProperties properties;

  public TokenPair issue(Long userId, Long tenantId, List<String> roles) {
    String accessJti = UUID.randomUUID().toString();
    String refreshJti = UUID.randomUUID().toString();
    Instant now = Instant.now();
    String access =
        build(
            properties.getJwt().getAccessSecret(),
            userId,
            tenantId,
            roles,
            accessJti,
            "access",
            now,
            properties.getJwt().getAccessTtlSeconds());
    String refresh =
        build(
            properties.getJwt().getRefreshSecret(),
            userId,
            tenantId,
            roles,
            refreshJti,
            "refresh",
            now,
            properties.getJwt().getRefreshTtlSeconds());
    return new TokenPair(access, refresh, accessJti, refreshJti);
  }

  public Claims parseAccess(String token) {
    return parse(properties.getJwt().getAccessSecret(), token);
  }

  public Claims parseRefresh(String token) {
    return parse(properties.getJwt().getRefreshSecret(), token);
  }

  private String build(
      String secret,
      Long userId,
      Long tenantId,
      List<String> roles,
      String jti,
      String typ,
      Instant now,
      long ttlSeconds) {
    return Jwts.builder()
        .id(jti)
        .subject(String.valueOf(userId))
        .claim("tid", tenantId)
        .claim("roles", roles)
        .claim("typ", typ)
        .issuedAt(Date.from(now))
        .expiration(Date.from(now.plusSeconds(ttlSeconds)))
        .signWith(key(secret))
        .compact();
  }

  private Claims parse(String secret, String token) {
    return Jwts.parser().verifyWith(key(secret)).build().parseSignedClaims(token).getPayload();
  }

  private SecretKey key(String secret) {
    byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
    if (bytes.length < 32) {
      byte[] padded = new byte[32];
      System.arraycopy(bytes, 0, padded, 0, bytes.length);
      bytes = padded;
    }
    return Keys.hmacShaKeyFor(bytes);
  }

  public record TokenPair(String accessToken, String refreshToken, String accessJti, String refreshJti) {}
}
