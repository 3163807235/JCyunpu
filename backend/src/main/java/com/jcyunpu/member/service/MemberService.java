package com.jcyunpu.member.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.jcyunpu.common.context.UserContext;
import com.jcyunpu.common.exception.BizException;
import com.jcyunpu.common.util.DateTimes;
import com.jcyunpu.genealogy.entity.Genealogy;
import com.jcyunpu.genealogy.service.GenealogyAccessService;
import com.jcyunpu.member.dto.MemberItemResponse;
import com.jcyunpu.member.entity.GenealogyMember;
import com.jcyunpu.member.mapper.GenealogyMemberMapper;
import com.jcyunpu.user.entity.UserAccount;
import com.jcyunpu.user.mapper.UserAccountMapper;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class MemberService {

  private final GenealogyMemberMapper memberMapper;
  private final UserAccountMapper userMapper;
  private final GenealogyAccessService accessService;
  private final InviteJoinService inviteJoinService;

  @Transactional
  public void joinByCode(String code) {
    Long userId = requireUserId();
    inviteJoinService.joinByCode(userId, code, "manual_code");
  }

  public List<MemberItemResponse> list(Long genealogyId) {
    Long userId = requireUserId();
    accessService.requireOwned(genealogyId, userId);
    List<GenealogyMember> rows =
        memberMapper.selectList(
            new LambdaQueryWrapper<GenealogyMember>()
                .eq(GenealogyMember::getGenealogyId, genealogyId)
                .eq(GenealogyMember::getStatus, 1)
                .orderByDesc(GenealogyMember::getJoinedAt));
    return rows.stream().map(this::toResponse).toList();
  }

  @Transactional
  public void remove(Long genealogyId, Long targetUserId) {
    Long userId = requireUserId();
    Genealogy g = accessService.requireOwned(genealogyId, userId);
    if (targetUserId.equals(g.getOwnerUserId())) {
      throw new BizException(30010, "不能移除族谱拥有者");
    }
    GenealogyMember member =
        memberMapper.selectOne(
            new LambdaQueryWrapper<GenealogyMember>()
                .eq(GenealogyMember::getGenealogyId, genealogyId)
                .eq(GenealogyMember::getUserId, targetUserId)
                .eq(GenealogyMember::getStatus, 1)
                .last("LIMIT 1"));
    if (member == null) {
      throw new BizException(30011, "成员不存在");
    }
    LocalDateTime now = LocalDateTime.now();
    member.setStatus(3);
    member.setLeftAt(now);
    member.setUpdatedAt(now);
    memberMapper.updateById(member);
  }

  @Transactional
  public void leave(Long genealogyId) {
    Long userId = requireUserId();
    Genealogy g = accessService.requireActive(genealogyId);
    if (userId.equals(g.getOwnerUserId())) {
      throw new BizException(30012, "拥有者不能退出族谱，请转让或删除");
    }
    String membership = accessService.resolveMembership(g, userId);
    if (!GenealogyAccessService.MEMBER.equals(membership)) {
      throw new BizException(30013, "你不是该族谱成员");
    }
    GenealogyMember member =
        memberMapper.selectOne(
            new LambdaQueryWrapper<GenealogyMember>()
                .eq(GenealogyMember::getGenealogyId, genealogyId)
                .eq(GenealogyMember::getUserId, userId)
                .eq(GenealogyMember::getStatus, 1)
                .last("LIMIT 1"));
    if (member == null) {
      throw new BizException(30013, "你不是该族谱成员");
    }
    LocalDateTime now = LocalDateTime.now();
    member.setStatus(2);
    member.setLeftAt(now);
    member.setUpdatedAt(now);
    memberMapper.updateById(member);
  }

  private MemberItemResponse toResponse(GenealogyMember m) {
    String display = m.getDisplayName();
    if (!StringUtils.hasText(display)) {
      UserAccount u = userMapper.selectById(m.getUserId());
      if (u != null) {
        display = StringUtils.hasText(u.getNickname()) ? u.getNickname() : maskPhone(u.getPhone());
      }
    }
    return MemberItemResponse.builder()
        .id(m.getId())
        .genealogyId(m.getGenealogyId())
        .userId(m.getUserId())
        .displayName(display)
        .status(m.getStatus())
        .joinSource(m.getJoinSource())
        .inviteCodeUsed(m.getInviteCodeUsed())
        .joinedAt(DateTimes.format(m.getJoinedAt()))
        .leftAt(DateTimes.format(m.getLeftAt()))
        .createdAt(DateTimes.format(m.getCreatedAt()))
        .updatedAt(DateTimes.format(m.getUpdatedAt()))
        .build();
  }

  private static String maskPhone(String phone) {
    if (!StringUtils.hasText(phone) || phone.length() < 7) {
      return phone;
    }
    return phone.substring(0, 3) + "****" + phone.substring(phone.length() - 4);
  }

  private Long requireUserId() {
    Long id = UserContext.getUserId();
    if (id == null) {
      throw new BizException(401, "未登录");
    }
    return id;
  }
}
