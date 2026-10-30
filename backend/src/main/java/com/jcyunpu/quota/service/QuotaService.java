package com.jcyunpu.quota.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.jcyunpu.common.exception.BizException;
import com.jcyunpu.genealogy.entity.Genealogy;
import com.jcyunpu.genealogy.mapper.GenealogyMapper;
import com.jcyunpu.person.entity.Person;
import com.jcyunpu.person.mapper.PersonMapper;
import com.jcyunpu.quota.entity.QuotaTransaction;
import com.jcyunpu.quota.mapper.QuotaTransactionMapper;
import com.jcyunpu.subscription.entity.Subscription;
import com.jcyunpu.subscription.mapper.SubscriptionMapper;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class QuotaService {

  private final SubscriptionMapper subscriptionMapper;
  private final QuotaTransactionMapper quotaTransactionMapper;
  private final GenealogyMapper genealogyMapper;
  private final PersonMapper personMapper;

  public Subscription requireActiveSubscription(Long tenantId) {
    Subscription sub =
        subscriptionMapper.selectOne(
            new LambdaQueryWrapper<Subscription>()
                .eq(Subscription::getTenantId, tenantId)
                .eq(Subscription::getStatus, 1)
                .orderByDesc(Subscription::getExpireDate)
                .last("LIMIT 1"));
    if (sub == null) {
      throw new BizException(22001, "无有效订阅，无法操作");
    }
    if (sub.getExpireDate() != null && sub.getExpireDate().isBefore(LocalDateTime.now())) {
      throw new BizException(22002, "订阅已过期，仅可只读");
    }
    return sub;
  }

  /** 含回收站；彻底删除后不再计入 */
  public int countPersonQuotaUsed(Long tenantId) {
    List<Genealogy> gens =
        genealogyMapper.selectList(
            new LambdaQueryWrapper<Genealogy>()
                .eq(Genealogy::getTenantId, tenantId)
                .ne(Genealogy::getStatus, 3));
    if (gens.isEmpty()) {
      return 0;
    }
    List<Long> ids = gens.stream().map(Genealogy::getId).toList();
    Long c =
        personMapper.selectCount(
            new LambdaQueryWrapper<Person>().in(Person::getGenealogyId, ids));
    return c == null ? 0 : c.intValue();
  }

  @Transactional
  public void consumePerson(Long tenantId, Long genealogyId, Long operatorUserId, int amount) {
    if (amount <= 0) {
      return;
    }
    Subscription sub = requireActiveSubscription(tenantId);
    int used = sub.getPersonUsed() == null ? 0 : sub.getPersonUsed();
    int limit = sub.getPersonQuota() == null ? 0 : sub.getPersonQuota();
    if (used + amount > limit) {
      throw new BizException(22003, "人物额度已用尽，请先扩容");
    }
    int afterUsed = used + amount;
    sub.setPersonUsed(afterUsed);
    sub.setUpdatedAt(LocalDateTime.now());
    if (subscriptionMapper.updateById(sub) != 1) {
      throw new BizException(22004, "额度扣减失败，请重试");
    }
    // balance_after = 变动后剩余额度（产品 §1.7.13）
    int balanceAfter = Math.max(0, limit - afterUsed);
    insertTx(
        tenantId, "person", "consume", -amount, balanceAfter, genealogyId, operatorUserId, "新增人物");
  }

  @Transactional
  public void releasePerson(Long tenantId, Long genealogyId, Long operatorUserId, int amount) {
    if (amount <= 0) {
      return;
    }
    Subscription sub =
        subscriptionMapper.selectOne(
            new LambdaQueryWrapper<Subscription>()
                .eq(Subscription::getTenantId, tenantId)
                .eq(Subscription::getStatus, 1)
                .orderByDesc(Subscription::getExpireDate)
                .last("LIMIT 1"));
    if (sub == null) {
      return;
    }
    int used = sub.getPersonUsed() == null ? 0 : sub.getPersonUsed();
    int afterUsed = Math.max(0, used - amount);
    sub.setPersonUsed(afterUsed);
    sub.setUpdatedAt(LocalDateTime.now());
    subscriptionMapper.updateById(sub);
    int limit = sub.getPersonQuota() == null ? 0 : sub.getPersonQuota();
    int balanceAfter = Math.max(0, limit - afterUsed);
    insertTx(
        tenantId,
        "person",
        "manual_purge",
        amount,
        balanceAfter,
        genealogyId,
        operatorUserId,
        "彻底删除人物");
  }

  private void insertTx(
      Long tenantId,
      String quotaType,
      String changeType,
      int changeAmount,
      int balanceAfter,
      Long genealogyId,
      Long operatorUserId,
      String remark) {
    QuotaTransaction tx = new QuotaTransaction();
    tx.setTenantId(tenantId);
    tx.setQuotaType(quotaType);
    tx.setChangeType(changeType);
    tx.setChangeAmount(changeAmount);
    tx.setBalanceAfter(balanceAfter);
    tx.setGenealogyId(genealogyId);
    tx.setOperatorUserId(operatorUserId);
    tx.setRemark(remark);
    tx.setCreatedAt(LocalDateTime.now());
    quotaTransactionMapper.insert(tx);
  }
}
