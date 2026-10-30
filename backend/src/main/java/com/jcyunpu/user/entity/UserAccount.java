package com.jcyunpu.user.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("`user`")
public class UserAccount {
  @TableId(type = IdType.AUTO)
  private Long id;
  private Long tenantId;
  private String phone;
  private String nickname;
  private String avatarUrl;
  private String passwordHash;
  private Integer isPrimary;
  private Integer status;
  private String roles;
  private LocalDateTime lastLoginAt;
  private String lastLoginIp;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}
