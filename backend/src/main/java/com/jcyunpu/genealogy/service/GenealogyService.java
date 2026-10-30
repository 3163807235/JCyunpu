package com.jcyunpu.genealogy.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.jcyunpu.collaborator.entity.Collaborator;
import com.jcyunpu.collaborator.mapper.CollaboratorMapper;
import com.jcyunpu.collaborator.service.CollaboratorService;
import com.jcyunpu.common.api.PageResult;
import com.jcyunpu.common.context.UserContext;
import com.jcyunpu.common.exception.BizException;
import com.jcyunpu.common.util.DateTimes;
import com.jcyunpu.genealogy.dto.CreateGenealogyRequest;
import com.jcyunpu.genealogy.dto.GenealogyItemResponse;
import com.jcyunpu.genealogy.dto.UpdateGenealogyRequest;
import com.jcyunpu.genealogy.entity.Genealogy;
import com.jcyunpu.genealogy.mapper.GenealogyMapper;
import com.jcyunpu.member.entity.GenealogyMember;
import com.jcyunpu.member.mapper.GenealogyMemberMapper;
import com.jcyunpu.member.service.InviteCodeService;
import com.jcyunpu.subscription.entity.Subscription;
import com.jcyunpu.subscription.mapper.SubscriptionMapper;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class GenealogyService {

  private final GenealogyMapper genealogyMapper;
  private final GenealogyMemberMapper memberMapper;
  private final CollaboratorMapper collaboratorMapper;
  private final CollaboratorService collaboratorService;
  private final SubscriptionMapper subscriptionMapper;
  private final InviteCodeService inviteCodeService;
  private final GenealogyAccessService accessService;

  public PageResult<GenealogyItemResponse> list(String scope, String keyword, long current, long size) {
    Long userId = requireUserId();
    boolean trash = "trash".equalsIgnoreCase(scope);
    Map<Long, String> membershipById = new HashMap<>();
    List<Genealogy> rows = new ArrayList<>();

    if (trash) {
      List<Genealogy> ownedTrash =
          genealogyMapper.selectList(
              new LambdaQueryWrapper<Genealogy>()
                  .eq(Genealogy::getOwnerUserId, userId)
                  .eq(Genealogy::getStatus, 2)
                  .orderByDesc(Genealogy::getDeletedAt));
      for (Genealogy g : ownedTrash) {
        membershipById.put(g.getId(), GenealogyAccessService.OWNER);
        rows.add(g);
      }
    } else {
      collectAccessible(userId, membershipById, rows);
      rows.sort(Comparator.comparing(Genealogy::getUpdatedAt, Comparator.nullsLast(Comparator.reverseOrder())));
    }

    if (StringUtils.hasText(keyword)) {
      String kw = keyword.trim().toLowerCase(Locale.ROOT);
      rows =
          rows.stream()
              .filter(
                  g ->
                      contains(g.getName(), kw)
                          || contains(g.getSurname(), kw)
                          || contains(g.getTanghao(), kw)
                          || contains(g.getGenealogyNo(), kw)
                          || contains(g.getShizuName(), kw))
              .collect(Collectors.toList());
    }

    long total = rows.size();
    long from = Math.max(0, (current - 1) * size);
    List<GenealogyItemResponse> page =
        rows.stream()
            .skip(from)
            .limit(size)
            .map(g -> toResponse(g, membershipById.get(g.getId())))
            .toList();
    return new PageResult<>(current, size, total, page);
  }

  public GenealogyItemResponse detail(Long id) {
    Long userId = requireUserId();
    Genealogy g = genealogyMapper.selectById(id);
    if (g == null || g.getStatus() == null || g.getStatus() != 1) {
      throw new BizException(21001, "族谱不存在或已删除");
    }
    String membership = accessService.requireAccess(g, userId);
    return toResponse(g, membership);
  }

  @Transactional
  public GenealogyItemResponse create(CreateGenealogyRequest req) {
    Long userId = requireUserId();
    Long tenantId = requireTenantId();
    String mode = normalizeMode(req.getMode());
    if (!"standard".equals(mode) && !"simple".equals(mode)) {
      throw new BizException(21010, "修谱模式无效");
    }

    Subscription sub = requireActiveSubscription(tenantId);
    long ownedActive =
        genealogyMapper.selectCount(
            new LambdaQueryWrapper<Genealogy>()
                .eq(Genealogy::getOwnerUserId, userId)
                .eq(Genealogy::getStatus, 1));
    int max = sub.getMaxGenealogyCount() == null ? 1 : sub.getMaxGenealogyCount();
    if (ownedActive >= max) {
      throw new BizException(21011, "当前套餐最多创建 " + max + " 个族谱");
    }

    LocalDateTime now = LocalDateTime.now();
    Genealogy g = new Genealogy();
    g.setTenantId(tenantId);
    g.setGenealogyNo("TMP-" + UUID.randomUUID().toString().replace("-", "").substring(0, 16));
    g.setName(req.getName().trim());
    g.setSurname(req.getSurname().trim());
    g.setTanghao(trimToNull(req.getHallName()));
    g.setShizuName(trimToNull(req.getAncestor()));
    g.setPrivacyMode(req.getPrivacy() == null ? 1 : req.getPrivacy());
    g.setLivingDesensitize(req.getLivingDesensitize() == null ? 1 : req.getLivingDesensitize());
    g.setOwnerUserId(userId);
    g.setMode(mode);
    g.setStatus(1);
    g.setCreatedAt(now);
    g.setUpdatedAt(now);
    genealogyMapper.insert(g);

    g.setGenealogyNo(String.format("JP-%06d", g.getId()));
    genealogyMapper.updateById(g);

    inviteCodeService.ensureForGenealogy(g.getId(), userId, null);
    collaboratorService.ensureOwnerOnCreate(g);
    return toResponse(g, GenealogyAccessService.OWNER);
  }

  @Transactional
  public GenealogyItemResponse update(Long id, UpdateGenealogyRequest req) {
    Long userId = requireUserId();
    Genealogy g = accessService.requireOwned(id, userId);
    if (g.getStatus() == null || g.getStatus() != 1) {
      throw new BizException(21001, "族谱不存在或已删除");
    }

    if (StringUtils.hasText(req.getName())) {
      g.setName(req.getName().trim());
    }
    if (StringUtils.hasText(req.getSurname())) {
      g.setSurname(req.getSurname().trim());
    }
    if (req.getHallName() != null) {
      g.setTanghao(trimToNull(req.getHallName()));
    }
    if (req.getAncestor() != null) {
      g.setShizuName(trimToNull(req.getAncestor()));
    }
    if (req.getPrivacy() != null) {
      g.setPrivacyMode(req.getPrivacy());
    }
    if (req.getLivingDesensitize() != null) {
      g.setLivingDesensitize(req.getLivingDesensitize());
    }
    if (StringUtils.hasText(req.getMode()) && !req.getMode().equals(g.getMode())) {
      if (!("simple".equals(g.getMode()) && "standard".equals(normalizeMode(req.getMode())))) {
        throw new BizException(21012, "修谱模式仅支持从简易升级为标准，不可降级");
      }
      g.setMode("standard");
    }
    g.setUpdatedAt(LocalDateTime.now());
    genealogyMapper.updateById(g);
    return toResponse(g, GenealogyAccessService.OWNER);
  }

  @Transactional
  public void trash(Long id) {
    Long userId = requireUserId();
    Genealogy g = accessService.requireOwned(id, userId);
    if (g.getStatus() == null || g.getStatus() != 1) {
      throw new BizException(21001, "族谱不存在或已删除");
    }
    LocalDateTime now = LocalDateTime.now();
    g.setStatus(2);
    g.setDeletedAt(now);
    g.setUpdatedAt(now);
    genealogyMapper.updateById(g);
  }

  @Transactional
  public GenealogyItemResponse restore(Long id) {
    Long userId = requireUserId();
    Long tenantId = requireTenantId();
    Genealogy g = accessService.requireOwned(id, userId);
    if (g.getStatus() == null || g.getStatus() != 2) {
      throw new BizException(21013, "仅回收站中的族谱可恢复");
    }
    Subscription sub = requireActiveSubscription(tenantId);
    long ownedActive =
        genealogyMapper.selectCount(
            new LambdaQueryWrapper<Genealogy>()
                .eq(Genealogy::getOwnerUserId, userId)
                .eq(Genealogy::getStatus, 1));
    int max = sub.getMaxGenealogyCount() == null ? 1 : sub.getMaxGenealogyCount();
    if (ownedActive >= max) {
      throw new BizException(21011, "当前套餐最多创建 " + max + " 个族谱，请先扩容或清理后再恢复");
    }
    LocalDateTime now = LocalDateTime.now();
    g.setStatus(1);
    g.setDeletedAt(null);
    g.setUpdatedAt(now);
    genealogyMapper.updateById(g);
    return toResponse(g, GenealogyAccessService.OWNER);
  }

  @Transactional
  public void purge(Long id) {
    Long userId = requireUserId();
    Genealogy g = accessService.requireOwned(id, userId);
    if (g.getStatus() == null || g.getStatus() != 2) {
      throw new BizException(21014, "请先移入回收站再彻底删除");
    }
    LocalDateTime now = LocalDateTime.now();
    g.setStatus(3);
    g.setUpdatedAt(now);
    genealogyMapper.updateById(g);
  }

  public PageResult<GenealogyItemResponse> trashList(long current, long size) {
    return list("trash", null, current, size);
  }

  private void collectAccessible(
      Long userId, Map<Long, String> membershipById, List<Genealogy> rows) {
    Set<Long> seen = new HashSet<>();

    List<Genealogy> owned =
        genealogyMapper.selectList(
            new LambdaQueryWrapper<Genealogy>()
                .eq(Genealogy::getOwnerUserId, userId)
                .eq(Genealogy::getStatus, 1));
    for (Genealogy g : owned) {
      seen.add(g.getId());
      membershipById.put(g.getId(), GenealogyAccessService.OWNER);
      rows.add(g);
    }

    List<GenealogyMember> members =
        memberMapper.selectList(
            new LambdaQueryWrapper<GenealogyMember>()
                .eq(GenealogyMember::getUserId, userId)
                .eq(GenealogyMember::getStatus, 1));
    for (GenealogyMember m : members) {
      if (seen.contains(m.getGenealogyId())) {
        continue;
      }
      Genealogy g = genealogyMapper.selectById(m.getGenealogyId());
      if (g == null || g.getStatus() == null || g.getStatus() != 1) {
        continue;
      }
      seen.add(g.getId());
      membershipById.put(g.getId(), GenealogyAccessService.MEMBER);
      rows.add(g);
    }

    List<Collaborator> collabs =
        collaboratorMapper.selectList(
            new LambdaQueryWrapper<Collaborator>()
                .eq(Collaborator::getUserId, userId)
                .eq(Collaborator::getInviteStatus, 1));
    for (Collaborator c : collabs) {
      if (seen.contains(c.getGenealogyId())) {
        // 若已是 member，协作优先
        if (GenealogyAccessService.MEMBER.equals(membershipById.get(c.getGenealogyId()))) {
          membershipById.put(c.getGenealogyId(), GenealogyAccessService.COLLABORATOR);
        }
        continue;
      }
      Genealogy g = genealogyMapper.selectById(c.getGenealogyId());
      if (g == null || g.getStatus() == null || g.getStatus() != 1) {
        continue;
      }
      seen.add(g.getId());
      membershipById.put(g.getId(), GenealogyAccessService.COLLABORATOR);
      rows.add(g);
    }
  }

  private Subscription requireActiveSubscription(Long tenantId) {
    Subscription sub =
        subscriptionMapper.selectOne(
            new LambdaQueryWrapper<Subscription>()
                .eq(Subscription::getTenantId, tenantId)
                .eq(Subscription::getStatus, 1)
                .orderByDesc(Subscription::getExpireDate)
                .last("LIMIT 1"));
    if (sub == null) {
      throw new BizException(22001, "无有效订阅，无法操作族谱");
    }
    if (sub.getExpireDate() != null && sub.getExpireDate().isBefore(LocalDateTime.now())) {
      throw new BizException(22002, "订阅已过期，请续费后再操作");
    }
    return sub;
  }

  private GenealogyItemResponse toResponse(Genealogy g, String membership) {
    return GenealogyItemResponse.builder()
        .id(g.getId())
        .genealogyNo(g.getGenealogyNo())
        .name(g.getName())
        .surname(g.getSurname())
        .hallName(g.getTanghao() == null ? "" : g.getTanghao())
        .ancestor(g.getShizuName() == null ? "" : g.getShizuName())
        .privacy(g.getPrivacyMode())
        .livingDesensitize(g.getLivingDesensitize() == null ? 1 : g.getLivingDesensitize())
        .mode(g.getMode())
        .personCount(0)
        .attachmentCount(0)
        .projectCount(0)
        .currentStage(1)
        .stageSchema(2)
        .layoutDirty(0)
        .ownerUserId(g.getOwnerUserId())
        .membership(membership)
        .createdAt(DateTimes.format(g.getCreatedAt()))
        .updatedAt(DateTimes.format(g.getUpdatedAt()))
        .deletedAt(DateTimes.format(g.getDeletedAt()))
        .build();
  }

  private static boolean contains(String value, String kwLower) {
    return value != null && value.toLowerCase(Locale.ROOT).contains(kwLower);
  }

  private static String trimToNull(String s) {
    if (!StringUtils.hasText(s)) {
      return null;
    }
    return s.trim();
  }

  private static String normalizeMode(String mode) {
    return mode == null ? "" : mode.trim().toLowerCase(Locale.ROOT);
  }

  private Long requireUserId() {
    Long id = UserContext.getUserId();
    if (id == null) {
      throw new BizException(401, "未登录");
    }
    return id;
  }

  private Long requireTenantId() {
    Long id = UserContext.getTenantId();
    if (id == null) {
      throw new BizException(401, "未登录");
    }
    return id;
  }
}
