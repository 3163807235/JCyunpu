package com.jcyunpu;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.jcyunpu.**.mapper")
public class JcyunpuApplication {

  public static void main(String[] args) {
    SpringApplication.run(JcyunpuApplication.class, args);
  }
}
