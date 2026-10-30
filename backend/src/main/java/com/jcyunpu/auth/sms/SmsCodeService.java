package com.jcyunpu.auth.sms;

import com.jcyunpu.common.config.JcyunpuProperties;
import com.jcyunpu.common.exception.BizException;
import java.time.Duration;
import java.util.concurrent.ThreadLocalRandom;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Slf4j
@Service
@RequiredArgsConstructor
public class SmsCodeService {

  private static final String CODE_KEY = "sms:code:";
  private static final String RATE_KEY = "sms:rate:";
  private static final Duration CODE_TTL = Duration.ofMinutes(5);
  private static final Duration RATE_TTL = Duration.ofMinutes(1);

  private final StringRedisTemplate redis;
  private final JcyunpuProperties properties;

  public void send(String phone, String scene) {
    requirePhone(phone);
    String sc = normalizeScene(scene);
    String rateKey = RATE_KEY + sc + ":" + phone;
    Boolean ok = redis.opsForValue().setIfAbsent(rateKey, "1", RATE_TTL);
    if (Boolean.FALSE.equals(ok)) {
      throw new BizException(20001, "发送过于频繁，请稍后再试");
    }

    String code =
        properties.getSms().isMockEnabled()
            ? properties.getSms().getMockCode()
            : String.format("%06d", ThreadLocalRandom.current().nextInt(0, 1_000_000));

    redis.opsForValue().set(CODE_KEY + sc + ":" + phone, code, CODE_TTL);
    if (properties.getSms().isMockEnabled()) {
      log.info("[SMS-MOCK] phone={} scene={} code={}", phone, sc, code);
    } else {
      // 生产对接短信网关；MVP 仅 Mock
      log.info("[SMS] phone={} scene={} sent", phone, sc);
    }
  }

  public void verifyOrThrow(String phone, String scene, String code) {
    requirePhone(phone);
    if (!StringUtils.hasText(code)) {
      throw new BizException(20002, "请输入验证码");
    }
    String sc = normalizeScene(scene);
    String key = CODE_KEY + sc + ":" + phone;
    String cached = redis.opsForValue().get(key);
    if (cached == null || !cached.equals(code.trim())) {
      throw new BizException(20002, "验证码错误或已过期");
    }
    redis.delete(key);
  }

  private void requirePhone(String phone) {
    if (!StringUtils.hasText(phone) || !phone.matches("^1\\d{10}$")) {
      throw new BizException(20003, "手机号格式不正确");
    }
  }

  private String normalizeScene(String scene) {
    if (!StringUtils.hasText(scene)) {
      return "login";
    }
    return scene.trim().toLowerCase();
  }
}
