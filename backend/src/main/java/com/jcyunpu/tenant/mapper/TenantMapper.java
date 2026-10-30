package com.jcyunpu.tenant.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.jcyunpu.tenant.entity.Tenant;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface TenantMapper extends BaseMapper<Tenant> {}
