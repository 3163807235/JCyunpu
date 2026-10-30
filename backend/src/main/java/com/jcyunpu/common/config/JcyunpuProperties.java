package com.jcyunpu.common.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "jcyunpu")
public class JcyunpuProperties {

  private final Jwt jwt = new Jwt();
  private final Sms sms = new Sms();
  private final Payment payment = new Payment();

  @Data
  public static class Jwt {
    private String accessSecret = "change_me_access";
    private String refreshSecret = "change_me_refresh";
    private long accessTtlSeconds = 7200;
    private long refreshTtlSeconds = 604800;
  }

  @Data
  public static class Sms {
    private boolean mockEnabled = true;
    private String mockCode = "123456";
  }

  @Data
  public static class Payment {
    private boolean mockEnabled = true;
  }
}
