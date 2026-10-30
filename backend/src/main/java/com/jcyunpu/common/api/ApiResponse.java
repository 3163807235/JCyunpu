package com.jcyunpu.common.api;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 统一响应 · 对齐根目录《必读文档》{ code, msg, data }
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {

  private int code;
  private String msg;
  private T data;

  public static <T> ApiResponse<T> ok(T data) {
    return new ApiResponse<>(200, "success", data);
  }

  public static ApiResponse<Void> ok() {
    return ok(null);
  }

  public static <T> ApiResponse<T> fail(int code, String msg) {
    return new ApiResponse<>(code, msg, null);
  }
}
