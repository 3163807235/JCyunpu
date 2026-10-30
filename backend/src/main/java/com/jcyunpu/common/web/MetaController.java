package com.jcyunpu.common.web;

import com.jcyunpu.common.api.ApiResponse;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** 开仓探活（非业务域） */
@RestController
@RequestMapping("/api/meta")
public class MetaController {

  @GetMapping("/ping")
  public ApiResponse<Map<String, Object>> ping() {
    return ApiResponse.ok(
        Map.of(
            "service", "jcyunpu-server",
            "phase", "skeleton",
            "docs", "docs/backend/README.md"));
  }
}
