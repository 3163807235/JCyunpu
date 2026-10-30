package com.jcyunpu.order.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jcyunpu.common.api.PageResult;
import com.jcyunpu.common.config.JcyunpuProperties;
import com.jcyunpu.common.context.UserContext;
import com.jcyunpu.common.exception.BizException;
import com.jcyunpu.common.util.DateTimes;
import com.jcyunpu.order.entity.Order;
import com.jcyunpu.order.mapper.OrderMapper;
import com.jcyunpu.quota.entity.QuotaTransaction;
import com.jcyunpu.quota.mapper.QuotaTransactionMapper;
import com.jcyunpu.quota.service.QuotaService;
import com.jcyunpu.subscription.catalog.PlanCatalog;
import com.jcyunpu.subscription.dto.ExpandPackResponse;
import com.jcyunpu.subscription.dto.OrderItemResponse;
import com.jcyunpu.subscription.dto.PlanOptionResponse;
import com.jcyunpu.subscription.dto.PurchaseExpandRequest;
import com.jcyunpu.subscription.dto.PurchasePlanRequest;
import com.jcyunpu.subscription.entity.Subscription;
import com.jcyunpu.subscription.mapper.SubscriptionMapper;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

  private final OrderMapper orderMapper;
  private final SubscriptionMapper subscriptionMapper;
  private final QuotaTransactionMapper quotaTransactionMapper;
  private final QuotaService quotaService;
  private final JcyunpuProperties properties;
  private final ObjectMapper objectMapper;

  @Transactional
  public OrderItemResponse purchasePlan(PurchasePlanRequest req) {
    Long userId = requireUserId();
    Long tenantId = requireTenantId();
    if ("trial".equalsIgnoreCase(req.getPlanType())) {
      throw new BizException(22010, "试用套餐不可购买");
    }
    PlanOptionResponse plan =
        PlanCatalog.findPlan(req.getPlanType())
            .orElseThrow(() -> new BizException(22011, "套餐不存在"));

    Subscription current = latestSubscription(tenantId);
    boolean sameActive =
        current != null
            && current.getStatus() != null
            && current.getStatus() == 1
            && (current.getExpireDate() == null || !current.getExpireDate().isBefore(LocalDateTime.now()))
            && plan.getPlanType().equalsIgnoreCase(current.getPlanType());
    String productType = sameActive ? "renewal" : "subscription";
    String productName = sameActive ? plan.getName() + "·续费" : plan.getName();

    LocalDateTime now = LocalDateTime.now();
    Order order = newOrder(tenantId, userId, productType, productName, plan.getPrice(), req.getPaymentMethod(), now);
    Map<String, Integer> granted = new HashMap<>();
    granted.put("person", plan.getPersonQuota());
    granted.put("storageMb", plan.getStorageQuotaMb());
    order.setGrantedQuota(writeJson(granted));
    orderMapper.insert(order);

    if (properties.getPayment().isMockEnabled()) {
      settlePlan(order, current, plan, Boolean.TRUE.equals(req.getAutoRenew()), userId, tenantId, now);
    } else {
      throw new BizException(22012, "真实支付尚未接入，请开启支付 Mock");
    }
    return toResponse(orderMapper.selectById(order.getId()));
  }

  @Transactional
  public OrderItemResponse purchaseExpand(PurchaseExpandRequest req) {
    Long userId = requireUserId();
    Long tenantId = requireTenantId();
    ExpandPackResponse pack =
        PlanCatalog.findPack(req.getPackId())
            .orElseThrow(() -> new BizException(22013, "扩容包不存在"));

    Subscription sub = quotaService.requireActiveSubscription(tenantId);
    if ("trial".equalsIgnoreCase(sub.getPlanType())) {
      throw new BizException(22014, "试用套餐不支持购买扩容包，请先升级");
    }

    LocalDateTime now = LocalDateTime.now();
    Order order =
        newOrder(
            tenantId,
            userId,
            pack.getProductType(),
            pack.getName(),
            pack.getAmount(),
            req.getPaymentMethod(),
            now);
    Map<String, Integer> granted = new HashMap<>();
    granted.put("person", pack.getPersonAdd() == null ? 0 : pack.getPersonAdd());
    granted.put("storageMb", pack.getStorageAddMb() == null ? 0 : pack.getStorageAddMb());
    order.setGrantedQuota(writeJson(granted));
    orderMapper.insert(order);

    if (properties.getPayment().isMockEnabled()) {
      settleExpand(order, sub, pack, userId, now);
    } else {
      throw new BizException(22012, "真实支付尚未接入，请开启支付 Mock");
    }
    return toResponse(orderMapper.selectById(order.getId()));
  }

  public PageResult<OrderItemResponse> listOrders(long current, long size, Integer paymentStatus) {
    Long tenantId = requireTenantId();
    LambdaQueryWrapper<Order> q =
        new LambdaQueryWrapper<Order>()
            .eq(Order::getTenantId, tenantId)
            .orderByDesc(Order::getCreatedAt);
    if (paymentStatus != null) {
      q.eq(Order::getPaymentStatus, paymentStatus);
    }
    Page<Order> page = orderMapper.selectPage(new Page<>(current, size), q);
    return new PageResult<>(
        page.getCurrent(),
        page.getSize(),
        page.getTotal(),
        page.getRecords().stream().map(this::toResponse).toList());
  }

  public OrderItemResponse detail(String orderNo) {
    Long tenantId = requireTenantId();
    Order order =
        orderMapper.selectOne(
            new LambdaQueryWrapper<Order>()
                .eq(Order::getOrderNo, orderNo)
                .eq(Order::getTenantId, tenantId)
                .last("LIMIT 1"));
    if (order == null) {
      throw new BizException(22015, "订单不存在");
    }
    return toResponse(order);
  }

  private void settlePlan(
      Order order,
      Subscription current,
      PlanOptionResponse plan,
      boolean autoRenew,
      Long userId,
      Long tenantId,
      LocalDateTime now) {
    order.setPaymentStatus(1);
    order.setPaidAt(now);
    order.setUpdatedAt(now);

    Subscription sub = current == null ? new Subscription() : current;
    if (current == null) {
      sub.setTenantId(tenantId);
      sub.setPersonUsed(0);
      sub.setStorageUsedMb(0);
      sub.setVersion(0L);
      sub.setCreatedAt(now);
    }
    sub.setPlanType(plan.getPlanType());
    sub.setStatus(1);
    sub.setStartDate(now);
    sub.setExpireDate(now.plusDays(plan.getDurationDays()));
    sub.setAutoRenew(autoRenew ? 1 : 0);
    sub.setPersonQuota(plan.getPersonQuota());
    sub.setStorageQuotaMb(plan.getStorageQuotaMb());
    sub.setMaxCollaborators(plan.getMaxCollaborators());
    sub.setMaxContinuationCount(plan.getMaxContinuationCount());
    sub.setMaxGenealogyCount(plan.getMaxGenealogyCount());
    sub.setAllowPdfExport(Boolean.TRUE.equals(plan.getAllowPdfExport()) ? 1 : 0);
    sub.setAllowBatchExport(Boolean.TRUE.equals(plan.getAllowBatchExport()) ? 1 : 0);
    sub.setOrderId(order.getId());
    sub.setUpdatedAt(now);

    if (sub.getId() == null) {
      subscriptionMapper.insert(sub);
    } else {
      if (subscriptionMapper.updateById(sub) != 1) {
        throw new BizException(22004, "订阅更新失败，请重试");
      }
    }
    order.setSubscriptionId(sub.getId());
    orderMapper.updateById(order);

    int used = quotaService.countPersonQuotaUsed(tenantId);
    int personBalance = Math.max(0, plan.getPersonQuota() - used);
    int storageUsed = sub.getStorageUsedMb() == null ? 0 : sub.getStorageUsedMb();
    int storageBalance = Math.max(0, plan.getStorageQuotaMb() - storageUsed);
    insertTx(
        tenantId,
        "person",
        "purchase",
        plan.getPersonQuota(),
        personBalance,
        userId,
        order.getId(),
        plan.getName() + "开通，额度重置为套餐上限");
    insertTx(
        tenantId,
        "storage",
        "purchase",
        plan.getStorageQuotaMb(),
        storageBalance,
        userId,
        order.getId(),
        plan.getName() + "存储额度生效");
    log.info("[PAY-MOCK] plan settled orderNo={} plan={}", order.getOrderNo(), plan.getPlanType());
  }

  private void settleExpand(
      Order order, Subscription sub, ExpandPackResponse pack, Long userId, LocalDateTime now) {
    order.setPaymentStatus(1);
    order.setPaidAt(now);
    order.setSubscriptionId(sub.getId());
    order.setUpdatedAt(now);
    orderMapper.updateById(order);

    int personAdd = pack.getPersonAdd() == null ? 0 : pack.getPersonAdd();
    int storageAdd = pack.getStorageAddMb() == null ? 0 : pack.getStorageAddMb();
    if (personAdd > 0) {
      sub.setPersonQuota((sub.getPersonQuota() == null ? 0 : sub.getPersonQuota()) + personAdd);
    }
    if (storageAdd > 0) {
      sub.setStorageQuotaMb(
          (sub.getStorageQuotaMb() == null ? 0 : sub.getStorageQuotaMb()) + storageAdd);
    }
    sub.setUpdatedAt(now);
    if (subscriptionMapper.updateById(sub) != 1) {
      throw new BizException(22004, "额度扩容失败，请重试");
    }

    Long tenantId = sub.getTenantId();
    if (personAdd > 0) {
      int used = quotaService.countPersonQuotaUsed(tenantId);
      int balance = Math.max(0, sub.getPersonQuota() - used);
      insertTx(tenantId, "person", "expand", personAdd, balance, userId, order.getId(), pack.getName());
    }
    if (storageAdd > 0) {
      int used = sub.getStorageUsedMb() == null ? 0 : sub.getStorageUsedMb();
      int balance = Math.max(0, sub.getStorageQuotaMb() - used);
      insertTx(
          tenantId, "storage", "expand", storageAdd, balance, userId, order.getId(), pack.getName());
    }
    log.info("[PAY-MOCK] expand settled orderNo={} pack={}", order.getOrderNo(), pack.getId());
  }

  private Order newOrder(
      Long tenantId,
      Long userId,
      String productType,
      String productName,
      int amount,
      String paymentMethod,
      LocalDateTime now) {
    Order order = new Order();
    order.setOrderNo(nextOrderNo());
    order.setTenantId(tenantId);
    order.setProductType(productType);
    order.setProductName(productName);
    order.setAmount(BigDecimal.valueOf(amount));
    order.setOriginalAmount(BigDecimal.valueOf(amount));
    order.setDiscountAmount(BigDecimal.ZERO);
    order.setPaymentMethod(normalizePay(paymentMethod));
    order.setPaymentStatus(0);
    order.setCreatedBy(userId);
    order.setCreatedAt(now);
    order.setUpdatedAt(now);
    order.setExpiredAt(now.plusHours(2));
    return order;
  }

  private void insertTx(
      Long tenantId,
      String quotaType,
      String changeType,
      int changeAmount,
      int balanceAfter,
      Long operatorUserId,
      Long orderId,
      String remark) {
    QuotaTransaction tx = new QuotaTransaction();
    tx.setTenantId(tenantId);
    tx.setQuotaType(quotaType);
    tx.setChangeType(changeType);
    tx.setChangeAmount(changeAmount);
    tx.setBalanceAfter(balanceAfter);
    tx.setOperatorUserId(operatorUserId);
    tx.setOrderId(orderId);
    tx.setRemark(remark);
    tx.setCreatedAt(LocalDateTime.now());
    quotaTransactionMapper.insert(tx);
  }

  private Subscription latestSubscription(Long tenantId) {
    return subscriptionMapper.selectOne(
        new LambdaQueryWrapper<Subscription>()
            .eq(Subscription::getTenantId, tenantId)
            .orderByDesc(Subscription::getExpireDate)
            .last("LIMIT 1"));
  }

  private String nextOrderNo() {
    String day = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
    long n = orderMapper.selectCount(null);
    return "GC" + day + String.format("%04d", (n % 10000) + 1);
  }

  private String normalizePay(String method) {
    if (!StringUtils.hasText(method)) {
      return "wechat";
    }
    String m = method.trim().toLowerCase(Locale.ROOT);
    if (!"wechat".equals(m) && !"alipay".equals(m)) {
      throw new BizException(22016, "支付方式无效");
    }
    return m;
  }

  private OrderItemResponse toResponse(Order order) {
    return OrderItemResponse.builder()
        .id(order.getId())
        .orderNo(order.getOrderNo())
        .productType(order.getProductType())
        .productName(order.getProductName())
        .amount(order.getAmount() == null ? 0d : order.getAmount().doubleValue())
        .paymentMethod(order.getPaymentMethod())
        .paymentStatus(order.getPaymentStatus())
        .paidAt(DateTimes.format(order.getPaidAt()))
        .createdAt(DateTimes.format(order.getCreatedAt()))
        .grantedQuota(readGranted(order.getGrantedQuota()))
        .build();
  }

  private Map<String, Integer> readGranted(String json) {
    if (!StringUtils.hasText(json)) {
      return null;
    }
    try {
      return objectMapper.readValue(json, new TypeReference<>() {});
    } catch (Exception e) {
      return null;
    }
  }

  private String writeJson(Map<String, Integer> map) {
    try {
      return objectMapper.writeValueAsString(map);
    } catch (Exception e) {
      return "{}";
    }
  }

  private Long requireUserId() {
    Long id = UserContext.getUserId();
    if (id == null) throw new BizException(401, "未登录");
    return id;
  }

  private Long requireTenantId() {
    Long id = UserContext.getTenantId();
    if (id == null) throw new BizException(401, "未登录");
    return id;
  }
}
