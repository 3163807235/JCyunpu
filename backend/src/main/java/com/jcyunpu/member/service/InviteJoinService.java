package com.jcyunpu.member.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.jcyunpu.common.exception.BizException;
import com.jcyunpu.genealogy.entity.Genealogy;
import com.jcyunpu.genealogy.mapper.GenealogyMapper;
import com.jcyunpu.member.entity.GenealogyInviteCode;
import com.jcyunpu.member.entity.GenealogyMember;
import com.jcyunpu.member.mapper.GenealogyInviteCodeMapper;
import com.jcyunpu.member.mapper.GenealogyMemberMapper;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/** 注册/登录后凭邀请码加入 L1 成员 · 成员专题 */
@Service
@RequiredArgsConstructor
public class InviteJoinService {

  private final GenealogyInviteCodeMapper inviteCodeMapper;
  private final GenealogyMemberMapper memberMapper;
  private final GenealogyMapper genealogyMapper;
  private final InviteCodeService inviteCodeService;

  /**
   * @param joinSource register_invite | manual_code
   */
  @Transactional
  public void joinByCode(Long userId, String rawCode, String joinSource) {
    if (!StringUtils.hasText(rawCode)) {
      return;
    }
    String code = rawCode.trim().toUpperCase();
    GenealogyInviteCode invite = inviteCodeService.requireActiveInvite(code);

    Genealogy genealogy = genealogyMapper.selectById(invite.getGenealogyId());
    if (genealogy == null || genealogy.getStatus() == null || genealogy.getStatus() != 1) {
      throw new BizException(30001, "邀请码无效或已作废");
    }
    if (userId.equals(genealogy.getOwnerUserId())) {
      throw new BizException(30008, "你已是该族谱拥有者，无需加入");
    }

    GenealogyMember existing =
        memberMapper.selectOne(
            new LambdaQueryWrapper<GenealogyMember>()
                .eq(GenealogyMember::getGenealogyId, invite.getGenealogyId())
                .eq(GenealogyMember::getUserId, userId)
                .last("LIMIT 1"));
    if (existing != null && existing.getStatus() != null && existing.getStatus() == 1) {
      throw new BizException(30004, "您已是该族谱成员");
    }

    LocalDateTime now = LocalDateTime.now();
    if (existing != null) {
      existing.setStatus(1);
      existing.setJoinSource(joinSource);
      existing.setInviteCodeUsed(code);
      existing.setJoinedAt(now);
      existing.setLeftAt(null);
      existing.setUpdatedAt(now);
      memberMapper.updateById(existing);
    } else {
      GenealogyMember member = new GenealogyMember();
      member.setGenealogyId(invite.getGenealogyId());
      member.setUserId(userId);
      member.setStatus(1);
      member.setJoinSource(joinSource);
      member.setInviteCodeUsed(code);
      member.setJoinedAt(now);
      member.setCreatedAt(now);
      member.setUpdatedAt(now);
      memberMapper.insert(member);
    }

    invite.setUsedCount(invite.getUsedCount() == null ? 1 : invite.getUsedCount() + 1);
    inviteCodeMapper.updateById(invite);
  }
}
