package com.jcyunpu.collaborator.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.jcyunpu.collaborator.dto.CollaboratorItemResponse;
import com.jcyunpu.collaborator.dto.CollaboratorListResponse;
import com.jcyunpu.collaborator.dto.InviteCollaboratorRequest;
import com.jcyunpu.collaborator.dto.MyCollaboratorInviteResponse;
import com.jcyunpu.collaborator.entity.Collaborator;
import com.jcyunpu.collaborator.mapper.CollaboratorMapper;
import com.jcyunpu.common.context.UserContext;
import com.jcyunpu.common.exception.BizException;
import com.jcyunpu.common.util.DateTimes;
import com.jcyunpu.genealogy.entity.Genealogy;
import com.jcyunpu.genealogy.mapper.GenealogyMapper;
import com.jcyunpu.genealogy.service.GenealogyAccessService;
import com.jcyunpu.quota.service.QuotaService;
import com.jcyunpu.subscription.entity.Subscription;
import com.jcyunpu.subscription.mapper.SubscriptionMapper;
import com.jcyunpu.user.entity.UserAccount;
import com.jcyunpu.user.mapper.UserAccountMapper;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * L2 协作 · 产品 §1.7.16 / OpenAPI §4；MVP 仅 owner+editor；席位不含拥有者。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CollaboratorService {

  private static final int INVITE_DAYS = 7;
  private static final int STATUS_PENDING = 0;
  private static final int STATUS_JOINED = 1;
  private static final int STATUS_REJECTED = 2;
  private static final int STATUS_EXPIRED = 3;
  private static final int STATUS_REMOVED = 4;

  private final CollaboratorMapper collaboratorMapper;
  private final UserAccountMapper userAccountMapper;
  private final GenealogyMapper genealogyMapper;
  private final SubscriptionMapper subscriptionMapper;
  private final GenealogyAccessService accessService;
  private final QuotaService quotaService;

  public CollaboratorListResponse list(Long genealogyId) {
    Long userId = requireUserId();
    Genealogy g = accessService.requireActiveAccessible(genealogyId, userId);
    expirePending(genealogyId);

    int maxSeats = resolveMaxCollaborators(g.getTenantId());

    List<Collaborator> rows =
        collaboratorMapper.selectList(
            new LambdaQueryWrapper<Collaborator>()
                .eq(Collaborator::getGenealogyId, genealogyId)
                .ne(Collaborator::getInviteStatus, STATUS_REMOVED));

    ensureOwnerRow(g, rows);

    Map<Long, UserAccount> users = loadUsers(rows, g.getOwnerUserId());
    List<CollaboratorItemResponse> list = new ArrayList<>();
    for (Collaborator c : rows) {
      if (c.getInviteStatus() != null && c.getInviteStatus() == STATUS_REMOVED) {
        continue;
      }
      list.add(toItem(c, users.get(c.getUserId())));
    }
    list.sort(
        Comparator.comparing((CollaboratorItemResponse i) -> !"owner".equals(i.getRole()))
            .thenComparing(
                CollaboratorItemResponse::getInvitedAt,
                Comparator.nullsLast(Comparator.reverseOrder())));

    int used = (int) list.stream().filter(this::isActiveSeat).count();
    return CollaboratorListResponse.builder()
        .list(list)
        .maxCollaborators(maxSeats)
        .usedSeats(used)
        .build();
  }

  @Transactional
  public CollaboratorItemResponse invite(Long genealogyId, InviteCollaboratorRequest req) {
    Long ownerId = requireUserId();
    Genealogy g = accessService.requireOwned(genealogyId, ownerId);
    if (g.getStatus() == null || g.getStatus() != 1) {
      throw new BizException(21001, "族谱不存在或已删除");
    }
    Subscription sub = quotaService.requireActiveSubscription(g.getTenantId());

    String role =
        StringUtils.hasText(req.getRole()) ? req.getRole().trim().toLowerCase(Locale.ROOT) : "editor";
    if (!"editor".equals(role)) {
      throw new BizException(23001, "MVP 仅支持邀请采编（editor）");
    }

    String phone = req.getPhone().trim();
    UserAccount invitee =
        userAccountMapper.selectOne(
            new LambdaQueryWrapper<UserAccount>().eq(UserAccount::getPhone, phone).last("LIMIT 1"));
    if (invitee == null) {
      throw new BizException(23002, "该手机号尚未注册，请对方先注册后再邀请");
    }
    if (invitee.getId().equals(g.getOwnerUserId()) || invitee.getId().equals(ownerId)) {
      throw new BizException(23003, "不能邀请拥有者本人");
    }
    if (invitee.getStatus() != null && invitee.getStatus() != 1) {
      throw new BizException(23004, "该账号不可用，无法邀请");
    }

    expirePending(genealogyId);
    Collaborator existing =
        collaboratorMapper.selectOne(
            new LambdaQueryWrapper<Collaborator>()
                .eq(Collaborator::getGenealogyId, genealogyId)
                .eq(Collaborator::getUserId, invitee.getId())
                .last("LIMIT 1"));
    if (existing != null
        && (Objects.equals(existing.getInviteStatus(), STATUS_PENDING)
            || Objects.equals(existing.getInviteStatus(), STATUS_JOINED))) {
      throw new BizException(23005, "该手机号已在协作名单中");
    }

    int used = countActiveSeats(genealogyId);
    int max = sub.getMaxCollaborators() == null ? 0 : sub.getMaxCollaborators();
    boolean reuseInactive =
        existing != null
            && (Objects.equals(existing.getInviteStatus(), STATUS_REMOVED)
                || Objects.equals(existing.getInviteStatus(), STATUS_EXPIRED)
                || Objects.equals(existing.getInviteStatus(), STATUS_REJECTED));
    if (!reuseInactive && used >= max) {
      throw new BizException(23006, "协作人数已达上限（" + max + "），请升级套餐后再邀请");
    }
    // 复用失效席位不额外占座；若失效仍计 used 则上面已处理。待接受/已加入复用禁止。

    LocalDateTime now = LocalDateTime.now();
    String display =
        StringUtils.hasText(req.getDisplayName())
            ? req.getDisplayName().trim()
            : (StringUtils.hasText(invitee.getNickname())
                ? invitee.getNickname()
                : "采编·" + phone.substring(phone.length() - 4));

    Collaborator row = reuseInactive ? existing : new Collaborator();
    row.setGenealogyId(genealogyId);
    row.setUserId(invitee.getId());
    row.setRole(role);
    row.setInviteStatus(STATUS_PENDING);
    row.setInviteToken("inv-" + genealogyId + "-" + UUID.randomUUID().toString().replace("-", ""));
    row.setInvitedBy(ownerId);
    row.setInvitedAt(now);
    row.setJoinedAt(null);
    row.setExpireAt(now.plusDays(INVITE_DAYS));
    row.setBranchScope(null);
    row.setUpdatedAt(now);
    if (row.getId() == null) {
      row.setCreatedAt(now);
      collaboratorMapper.insert(row);
    } else {
      collaboratorMapper.updateById(row);
    }
    // 沙箱：真实短信未接，日志便于联调（产品旅程二：短信/链接）
    log.info(
        "[COLLAB-INVITE] genealogyId={} inviteePhone={} inviteToken={} expireAt={}",
        genealogyId,
        phone,
        row.getInviteToken(),
        DateTimes.format(row.getExpireAt()));
    CollaboratorItemResponse item = toItem(row, invitee);
    item.setDisplayName(display);
    return item;
  }

  /** 被邀请人待办列表（产品 §3.4 页面 14 协作邀请） */
  public List<MyCollaboratorInviteResponse> listMyPendingInvites() {
    Long userId = requireUserId();
    expirePendingForUser(userId);
    List<Collaborator> rows =
        collaboratorMapper.selectList(
            new LambdaQueryWrapper<Collaborator>()
                .eq(Collaborator::getUserId, userId)
                .eq(Collaborator::getInviteStatus, STATUS_PENDING)
                .ne(Collaborator::getRole, "owner")
                .orderByDesc(Collaborator::getInvitedAt));
    if (rows.isEmpty()) {
      return List.of();
    }
    Set<Long> genealogyIds =
        rows.stream().map(Collaborator::getGenealogyId).filter(Objects::nonNull).collect(Collectors.toSet());
    Set<Long> inviterIds =
        rows.stream().map(Collaborator::getInvitedBy).filter(Objects::nonNull).collect(Collectors.toSet());
    Map<Long, Genealogy> genealogies = new HashMap<>();
    if (!genealogyIds.isEmpty()) {
      for (Genealogy g : genealogyMapper.selectBatchIds(genealogyIds)) {
        genealogies.put(g.getId(), g);
      }
    }
    Map<Long, UserAccount> inviters = new HashMap<>();
    if (!inviterIds.isEmpty()) {
      for (UserAccount u : userAccountMapper.selectBatchIds(inviterIds)) {
        inviters.put(u.getId(), u);
      }
    }
    List<MyCollaboratorInviteResponse> out = new ArrayList<>();
    for (Collaborator c : rows) {
      Genealogy g = genealogies.get(c.getGenealogyId());
      if (g == null || g.getStatus() == null || g.getStatus() != 1) {
        continue;
      }
      UserAccount inviter = c.getInvitedBy() == null ? null : inviters.get(c.getInvitedBy());
      String inviterName =
          inviter == null
              ? "族谱拥有者"
              : (StringUtils.hasText(inviter.getNickname())
                  ? inviter.getNickname()
                  : "用户" + inviter.getId());
      out.add(
          MyCollaboratorInviteResponse.builder()
              .id(c.getId())
              .genealogyId(c.getGenealogyId())
              .genealogyName(g.getName())
              .genealogyNo(g.getGenealogyNo())
              .surname(g.getSurname())
              .role(c.getRole())
              .inviteStatus(c.getInviteStatus())
              .inviteToken(c.getInviteToken())
              .invitedBy(c.getInvitedBy())
              .inviterName(inviterName)
              .invitedAt(DateTimes.format(c.getInvitedAt()))
              .expireAt(DateTimes.format(c.getExpireAt()))
              .build());
    }
    return out;
  }

  @Transactional
  public CollaboratorItemResponse acceptMine(Long collaboratorId) {
    Long userId = requireUserId();
    Collaborator row = requirePendingMine(collaboratorId, userId);
    LocalDateTime now = LocalDateTime.now();
    row.setInviteStatus(STATUS_JOINED);
    row.setJoinedAt(now);
    row.setUpdatedAt(now);
    collaboratorMapper.updateById(row);
    return toItem(row, userAccountMapper.selectById(userId));
  }

  @Transactional
  public void rejectMine(Long collaboratorId) {
    Long userId = requireUserId();
    Collaborator row = requirePendingMine(collaboratorId, userId);
    row.setInviteStatus(STATUS_REJECTED);
    row.setUpdatedAt(LocalDateTime.now());
    collaboratorMapper.updateById(row);
  }

  /** @deprecated 谱内 accept 仅保留兼容；正式入口为 /api/user/collaborator-invites/{id}/accept */
  @Transactional
  public CollaboratorItemResponse accept(Long genealogyId, Long collaboratorId) {
    Long userId = requireUserId();
    accessService.requireActive(genealogyId);
    expirePending(genealogyId);
    Collaborator row = collaboratorMapper.selectById(collaboratorId);
    if (row == null || !genealogyId.equals(row.getGenealogyId())) {
      throw new BizException(23007, "邀请不存在");
    }
    if (!userId.equals(row.getUserId())) {
      throw new BizException(23008, "仅被邀请人可接受协作邀请");
    }
    return acceptMine(collaboratorId);
  }

  private Collaborator requirePendingMine(Long collaboratorId, Long userId) {
    Collaborator row = collaboratorMapper.selectById(collaboratorId);
    if (row == null || !userId.equals(row.getUserId())) {
      throw new BizException(23007, "邀请不存在");
    }
    if ("owner".equalsIgnoreCase(row.getRole())) {
      throw new BizException(23008, "仅被邀请人可操作");
    }
    expirePending(row.getGenealogyId());
    row = collaboratorMapper.selectById(collaboratorId);
    if (row == null) {
      throw new BizException(23007, "邀请不存在");
    }
    if (Objects.equals(row.getInviteStatus(), STATUS_EXPIRED)
        || (row.getExpireAt() != null && row.getExpireAt().isBefore(LocalDateTime.now()))) {
      row.setInviteStatus(STATUS_EXPIRED);
      row.setUpdatedAt(LocalDateTime.now());
      collaboratorMapper.updateById(row);
      throw new BizException(23009, "邀请已过期，请重新邀请");
    }
    if (!Objects.equals(row.getInviteStatus(), STATUS_PENDING)) {
      throw new BizException(23010, "当前状态不可操作");
    }
    return row;
  }

  private void expirePendingForUser(Long userId) {
    LocalDateTime now = LocalDateTime.now();
    List<Collaborator> pending =
        collaboratorMapper.selectList(
            new LambdaQueryWrapper<Collaborator>()
                .eq(Collaborator::getUserId, userId)
                .eq(Collaborator::getInviteStatus, STATUS_PENDING)
                .lt(Collaborator::getExpireAt, now));
    for (Collaborator c : pending) {
      c.setInviteStatus(STATUS_EXPIRED);
      c.setUpdatedAt(now);
      collaboratorMapper.updateById(c);
    }
  }

  @Transactional
  public void remove(Long genealogyId, Long targetUserId) {
    Long ownerId = requireUserId();
    Genealogy g = accessService.requireOwned(genealogyId, ownerId);
    quotaService.requireActiveSubscription(g.getTenantId());

    if (targetUserId.equals(g.getOwnerUserId())) {
      throw new BizException(23011, "不能移除族谱拥有者");
    }
    Collaborator row =
        collaboratorMapper.selectOne(
            new LambdaQueryWrapper<Collaborator>()
                .eq(Collaborator::getGenealogyId, genealogyId)
                .eq(Collaborator::getUserId, targetUserId)
                .last("LIMIT 1"));
    if (row == null || Objects.equals(row.getInviteStatus(), STATUS_REMOVED)) {
      throw new BizException(23012, "协作成员不存在");
    }
    if ("owner".equalsIgnoreCase(row.getRole())) {
      throw new BizException(23011, "不能移除族谱拥有者");
    }
    row.setInviteStatus(STATUS_REMOVED);
    row.setUpdatedAt(LocalDateTime.now());
    collaboratorMapper.updateById(row);
    // 默认保留 L1 genealogy_member（若有）— 不删
  }

  /** 创建族谱时写入拥有者协作记录（§1.7.16） */
  @Transactional
  public void ensureOwnerOnCreate(Genealogy g) {
    if (g == null || g.getId() == null || g.getOwnerUserId() == null) {
      return;
    }
    Collaborator existing =
        collaboratorMapper.selectOne(
            new LambdaQueryWrapper<Collaborator>()
                .eq(Collaborator::getGenealogyId, g.getId())
                .eq(Collaborator::getUserId, g.getOwnerUserId())
                .last("LIMIT 1"));
    LocalDateTime now = LocalDateTime.now();
    if (existing == null) {
      Collaborator owner = new Collaborator();
      owner.setGenealogyId(g.getId());
      owner.setUserId(g.getOwnerUserId());
      owner.setRole("owner");
      owner.setInviteStatus(STATUS_JOINED);
      owner.setJoinedAt(now);
      owner.setCreatedAt(now);
      owner.setUpdatedAt(now);
      collaboratorMapper.insert(owner);
      return;
    }
    if (!"owner".equalsIgnoreCase(existing.getRole())
        || !Objects.equals(existing.getInviteStatus(), STATUS_JOINED)) {
      existing.setRole("owner");
      existing.setInviteStatus(STATUS_JOINED);
      if (existing.getJoinedAt() == null) {
        existing.setJoinedAt(now);
      }
      existing.setUpdatedAt(now);
      collaboratorMapper.updateById(existing);
    }
  }

  private void ensureOwnerRow(Genealogy g, List<Collaborator> rows) {
    boolean hasOwner =
        rows.stream()
            .anyMatch(
                c ->
                    "owner".equalsIgnoreCase(c.getRole())
                        && Objects.equals(c.getUserId(), g.getOwnerUserId()));
    if (hasOwner) {
      return;
    }
    Collaborator byUser =
        rows.stream()
            .filter(c -> Objects.equals(c.getUserId(), g.getOwnerUserId()))
            .findFirst()
            .orElse(null);
    if (byUser != null) {
      byUser.setRole("owner");
      byUser.setInviteStatus(STATUS_JOINED);
      collaboratorMapper.updateById(byUser);
      return;
    }
    ensureOwnerOnCreate(g);
    Collaborator inserted =
        collaboratorMapper.selectOne(
            new LambdaQueryWrapper<Collaborator>()
                .eq(Collaborator::getGenealogyId, g.getId())
                .eq(Collaborator::getUserId, g.getOwnerUserId())
                .last("LIMIT 1"));
    if (inserted != null) {
      rows.add(inserted);
    }
  }

  private void expirePending(Long genealogyId) {
    LocalDateTime now = LocalDateTime.now();
    List<Collaborator> pending =
        collaboratorMapper.selectList(
            new LambdaQueryWrapper<Collaborator>()
                .eq(Collaborator::getGenealogyId, genealogyId)
                .eq(Collaborator::getInviteStatus, STATUS_PENDING)
                .lt(Collaborator::getExpireAt, now));
    for (Collaborator c : pending) {
      c.setInviteStatus(STATUS_EXPIRED);
      c.setUpdatedAt(now);
      collaboratorMapper.updateById(c);
    }
  }

  private int countActiveSeats(Long genealogyId) {
    Long c =
        collaboratorMapper.selectCount(
            new LambdaQueryWrapper<Collaborator>()
                .eq(Collaborator::getGenealogyId, genealogyId)
                .ne(Collaborator::getRole, "owner")
                .in(Collaborator::getInviteStatus, STATUS_PENDING, STATUS_JOINED));
    return c == null ? 0 : c.intValue();
  }

  private int resolveMaxCollaborators(Long tenantId) {
    Subscription sub =
        subscriptionMapper.selectOne(
            new LambdaQueryWrapper<Subscription>()
                .eq(Subscription::getTenantId, tenantId)
                .orderByDesc(Subscription::getExpireDate)
                .last("LIMIT 1"));
    if (sub == null || sub.getMaxCollaborators() == null) {
      return 0;
    }
    return sub.getMaxCollaborators();
  }

  private boolean isActiveSeat(CollaboratorItemResponse item) {
    return !"owner".equals(item.getRole())
        && (Objects.equals(item.getInviteStatus(), STATUS_PENDING)
            || Objects.equals(item.getInviteStatus(), STATUS_JOINED));
  }

  private Map<Long, UserAccount> loadUsers(List<Collaborator> rows, Long ownerId) {
    Set<Long> ids = new HashSet<>();
    for (Collaborator c : rows) {
      if (c.getUserId() != null) {
        ids.add(c.getUserId());
      }
    }
    if (ownerId != null) {
      ids.add(ownerId);
    }
    Map<Long, UserAccount> map = new HashMap<>();
    if (ids.isEmpty()) {
      return map;
    }
    for (UserAccount u : userAccountMapper.selectBatchIds(ids)) {
      map.put(u.getId(), u);
    }
    return map;
  }

  private CollaboratorItemResponse toItem(Collaborator c, UserAccount u) {
    String phone = u == null ? "" : (u.getPhone() == null ? "" : u.getPhone());
    String display;
    if (u != null && StringUtils.hasText(u.getNickname())) {
      display = u.getNickname();
    } else if (StringUtils.hasText(phone) && phone.length() >= 4) {
      display = ("owner".equalsIgnoreCase(c.getRole()) ? "拥有者" : "采编") + "·" + phone.substring(phone.length() - 4);
    } else {
      display = "用户" + c.getUserId();
    }
    return CollaboratorItemResponse.builder()
        .id(c.getId())
        .genealogyId(c.getGenealogyId())
        .userId(c.getUserId())
        .displayName(display)
        .phone(phone)
        .role(c.getRole())
        .inviteStatus(c.getInviteStatus())
        .inviteToken(c.getInviteToken())
        .invitedBy(c.getInvitedBy())
        .invitedAt(DateTimes.format(c.getInvitedAt()))
        .joinedAt(DateTimes.format(c.getJoinedAt()))
        .expireAt(DateTimes.format(c.getExpireAt()))
        .createdAt(DateTimes.format(c.getCreatedAt()))
        .updatedAt(DateTimes.format(c.getUpdatedAt()))
        .build();
  }

  private Long requireUserId() {
    Long id = UserContext.getUserId();
    if (id == null) {
      throw new BizException(401, "未登录");
    }
    return id;
  }
}
