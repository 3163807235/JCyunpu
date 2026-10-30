package com.jcyunpu.quota.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.jcyunpu.common.api.PageResult;
import com.jcyunpu.common.context.UserContext;
import com.jcyunpu.common.exception.BizException;
import com.jcyunpu.common.util.DateTimes;
import com.jcyunpu.genealogy.entity.Genealogy;
import com.jcyunpu.genealogy.mapper.GenealogyMapper;
import com.jcyunpu.quota.entity.QuotaTransaction;
import com.jcyunpu.quota.mapper.QuotaTransactionMapper;
import com.jcyunpu.subscription.dto.QuotaTransactionItemResponse;
import com.jcyunpu.user.entity.UserAccount;
import com.jcyunpu.user.mapper.UserAccountMapper;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class QuotaQueryService {

  private final QuotaTransactionMapper quotaTransactionMapper;
  private final GenealogyMapper genealogyMapper;
  private final UserAccountMapper userAccountMapper;

  public PageResult<QuotaTransactionItemResponse> listTransactions(
      long current, long size, String quotaType, String changeType) {
    Long tenantId = UserContext.getTenantId();
    if (tenantId == null) {
      throw new BizException(401, "未登录");
    }
    LambdaQueryWrapper<QuotaTransaction> q =
        new LambdaQueryWrapper<QuotaTransaction>()
            .eq(QuotaTransaction::getTenantId, tenantId)
            .orderByDesc(QuotaTransaction::getCreatedAt);
    if (StringUtils.hasText(quotaType)) {
      q.eq(QuotaTransaction::getQuotaType, quotaType);
    }
    if (StringUtils.hasText(changeType)) {
      q.eq(QuotaTransaction::getChangeType, changeType);
    }
    Page<QuotaTransaction> page =
        quotaTransactionMapper.selectPage(new Page<>(current, size), q);
    List<QuotaTransaction> records = page.getRecords();
    Map<Long, String> genealogyNames = loadGenealogyNames(records);
    Map<Long, String> operatorNames = loadOperatorNames(records);
    return new PageResult<>(
        page.getCurrent(),
        page.getSize(),
        page.getTotal(),
        records.stream()
            .map(
                tx ->
                    QuotaTransactionItemResponse.builder()
                        .id(tx.getId())
                        .quotaType(tx.getQuotaType())
                        .changeType(tx.getChangeType())
                        .changeAmount(tx.getChangeAmount())
                        .balanceAfter(tx.getBalanceAfter())
                        .genealogyName(
                            tx.getGenealogyId() == null
                                ? null
                                : genealogyNames.get(tx.getGenealogyId()))
                        .operatorName(
                            operatorNames.getOrDefault(tx.getOperatorUserId(), "系统"))
                        .remark(tx.getRemark())
                        .orderId(tx.getOrderId())
                        .createdAt(DateTimes.format(tx.getCreatedAt()))
                        .build())
            .toList());
  }

  private Map<Long, String> loadGenealogyNames(List<QuotaTransaction> records) {
    Set<Long> ids =
        records.stream()
            .map(QuotaTransaction::getGenealogyId)
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());
    if (ids.isEmpty()) {
      return Map.of();
    }
    Map<Long, String> map = new HashMap<>();
    for (Genealogy g : genealogyMapper.selectBatchIds(ids)) {
      map.put(g.getId(), g.getName());
    }
    return map;
  }

  private Map<Long, String> loadOperatorNames(List<QuotaTransaction> records) {
    Set<Long> ids =
        records.stream()
            .map(QuotaTransaction::getOperatorUserId)
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());
    if (ids.isEmpty()) {
      return Map.of();
    }
    Map<Long, String> map = new HashMap<>();
    for (UserAccount u : userAccountMapper.selectBatchIds(ids)) {
      String name =
          StringUtils.hasText(u.getNickname()) ? u.getNickname() : "用户" + u.getId();
      map.put(u.getId(), name);
    }
    return map;
  }
}
