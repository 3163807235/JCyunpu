package com.jcyunpu.common.api;

import java.util.Collections;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** 分页 · current/size/records/total */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PageResult<T> {

  private long current;
  private long size;
  private long total;
  private List<T> records;

  public static <T> PageResult<T> empty(long current, long size) {
    return new PageResult<>(current, size, 0, Collections.emptyList());
  }
}
