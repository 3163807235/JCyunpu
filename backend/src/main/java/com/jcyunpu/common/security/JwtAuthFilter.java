package com.jcyunpu.common.security;

import com.jcyunpu.common.context.UserContext;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

  private final JwtService jwtService;
  private final TokenBlacklistService blacklistService;

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {
    try {
      String header = request.getHeader(HttpHeaders.AUTHORIZATION);
      if (header != null && header.startsWith("Bearer ")) {
        try {
          String token = header.substring(7);
          Claims claims = jwtService.parseAccess(token);
          if ("access".equals(claims.get("typ", String.class))
              && !blacklistService.isBlacklisted(claims.getId())) {
            Long userId = Long.valueOf(claims.getSubject());
            Long tenantId = claims.get("tid", Number.class).longValue();
            List<String> roles = readRoles(claims);
            UserContext.set(userId, tenantId);
            var authorities =
                roles.stream().map(SimpleGrantedAuthority::new).collect(Collectors.toList());
            var auth = new UsernamePasswordAuthenticationToken(userId, null, authorities);
            SecurityContextHolder.getContext().setAuthentication(auth);
          }
        } catch (Exception e) {
          log.debug("jwt parse skipped: {}", e.getMessage());
        }
      }
      filterChain.doFilter(request, response);
    } finally {
      UserContext.clear();
      SecurityContextHolder.clearContext();
    }
  }

  @SuppressWarnings("unchecked")
  private List<String> readRoles(Claims claims) {
    Object raw = claims.get("roles");
    if (raw instanceof Collection<?> col) {
      return col.stream().map(String::valueOf).toList();
    }
    return List.of();
  }
}
