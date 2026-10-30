package com.jcyunpu.common.context;

/**
 * 请求上下文（JWT 落地后由过滤器写入）。
 * tenantId / userId 用于租户隔离与谱授权校验。
 */
public final class UserContext {

  private static final ThreadLocal<Long> USER_ID = new ThreadLocal<>();
  private static final ThreadLocal<Long> TENANT_ID = new ThreadLocal<>();

  private UserContext() {}

  public static void set(Long userId, Long tenantId) {
    USER_ID.set(userId);
    TENANT_ID.set(tenantId);
  }

  public static Long getUserId() {
    return USER_ID.get();
  }

  public static Long getTenantId() {
    return TENANT_ID.get();
  }

  public static void clear() {
    USER_ID.remove();
    TENANT_ID.remove();
  }
}
