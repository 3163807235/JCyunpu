package com.jcyunpu.common.exception;

import com.jcyunpu.common.api.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.validation.BindException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(BizException.class)
  @ResponseStatus(HttpStatus.OK)
  public ApiResponse<Void> handleBiz(BizException e) {
    return ApiResponse.fail(e.getCode(), e.getMessage());
  }

  @ExceptionHandler({MethodArgumentNotValidException.class, BindException.class})
  @ResponseStatus(HttpStatus.OK)
  public ApiResponse<Void> handleValid(Exception e) {
    String msg = "参数校验失败";
    if (e instanceof MethodArgumentNotValidException manv && manv.getBindingResult().getFieldError() != null) {
      msg = manv.getBindingResult().getFieldError().getDefaultMessage();
    } else if (e instanceof BindException be && be.getBindingResult().getFieldError() != null) {
      msg = be.getBindingResult().getFieldError().getDefaultMessage();
    }
    return ApiResponse.fail(400, msg);
  }

  @ExceptionHandler(Exception.class)
  @ResponseStatus(HttpStatus.OK)
  public ApiResponse<Void> handleOther(Exception e) {
    log.error("unhandled", e);
    return ApiResponse.fail(500, "服务器内部错误");
  }
}
