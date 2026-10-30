package com.jcyunpu.common.util;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public final class DateTimes {
  private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

  private DateTimes() {}

  public static String format(LocalDateTime t) {
    return t == null ? null : t.format(FMT);
  }
}
