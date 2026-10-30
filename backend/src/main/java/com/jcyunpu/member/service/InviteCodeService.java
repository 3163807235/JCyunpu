package com.jcyunpu.member.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.jcyunpu.common.exception.BizException;
import com.jcyunpu.common.util.DateTimes;
import com.jcyunpu.genealogy.entity.Genealogy;
import com.jcyunpu.genealogy.mapper.GenealogyMapper;
import com.jcyunpu.genealogy.service.GenealogyAccessService;
import com.jcyunpu.member.dto.InviteCodeResponse;
import com.jcyunpu.member.dto.InvitePreviewResponse;
import com.jcyunpu.member.entity.GenealogyInviteCode;
import com.jcyunpu.member.mapper.GenealogyInviteCodeMapper;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class InviteCodeService {

  private static final String ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  private static final SecureRandom RANDOM = new SecureRandom();
  private static final int DEFAULT_MAX_USES = 200;

  private final GenealogyInviteCodeMapper inviteCodeMapper;
  private final GenealogyMapper genealogyMapper;
  private final GenealogyAccessService accessService;

  public InvitePreviewResponse preview(String rawCode) {
    if (!StringUtils.hasText(rawCode)) {
      throw new BizException(30005, "请输入族谱邀请码");
    }
    String code = rawCode.trim().toUpperCase();
    if (!code.matches("^[A-HJ-NP-Z2-9]{6,16}$")) {
      throw new BizException(30006, "邀请码格式不正确");
    }
    GenealogyInviteCode invite = requireActiveInvite(code);
    Genealogy g = genealogyMapper.selectById(invite.getGenealogyId());
    if (g == null || g.getStatus() == null || g.getStatus() != 1) {
      throw new BizException(30001, "邀请码无效或已作废");
    }
    return InvitePreviewResponse.builder()
        .genealogyId(g.getId())
        .name(g.getName())
        .surname(g.getSurname())
        .hallName(g.getTanghao())
        .code(invite.getCode())
        .build();
  }

  public InviteCodeResponse getActiveForOwner(Long genealogyId, Long userId) {
    accessService.requireOwned(genealogyId, userId);
    GenealogyInviteCode invite = findActive(genealogyId);
    if (invite == null) {
      invite = createCode(genealogyId, userId, null);
    }
    return toResponse(invite);
  }

  @Transactional
  public InviteCodeResponse rotate(Long genealogyId, Long userId) {
    accessService.requireOwned(genealogyId, userId);
    LocalDateTime now = LocalDateTime.now();
    GenealogyInviteCode active = findActive(genealogyId);
    if (active != null) {
      active.setStatus(0);
      active.setRevokedAt(now);
      inviteCodeMapper.updateById(active);
    }
    return toResponse(createCode(genealogyId, userId, null));
  }

  /** 建谱时生成；可指定 preferred（演示/测试） */
  public GenealogyInviteCode ensureForGenealogy(Long genealogyId, Long createdBy, String preferred) {
    GenealogyInviteCode existing = findActive(genealogyId);
    if (existing != null) {
      return existing;
    }
    return createCode(genealogyId, createdBy, preferred);
  }

  public GenealogyInviteCode requireActiveInvite(String code) {
    GenealogyInviteCode invite =
        inviteCodeMapper.selectOne(
            new LambdaQueryWrapper<GenealogyInviteCode>()
                .eq(GenealogyInviteCode::getCode, code)
                .eq(GenealogyInviteCode::getStatus, 1)
                .last("LIMIT 1"));
    if (invite == null) {
      throw new BizException(30001, "邀请码无效或已作废");
    }
    if (invite.getExpireAt() != null && invite.getExpireAt().isBefore(LocalDateTime.now())) {
      throw new BizException(30002, "邀请码已过期");
    }
    if (invite.getMaxUses() != null && invite.getUsedCount() >= invite.getMaxUses()) {
      throw new BizException(30003, "邀请码使用次数已用尽");
    }
    return invite;
  }

  private GenealogyInviteCode findActive(Long genealogyId) {
    return inviteCodeMapper.selectOne(
        new LambdaQueryWrapper<GenealogyInviteCode>()
            .eq(GenealogyInviteCode::getGenealogyId, genealogyId)
            .eq(GenealogyInviteCode::getStatus, 1)
            .last("LIMIT 1"));
  }

  private GenealogyInviteCode createCode(Long genealogyId, Long createdBy, String preferred) {
    String code =
        StringUtils.hasText(preferred) ? preferred.trim().toUpperCase() : generateUniqueCode();
    if (existsActiveCode(code)) {
      code = generateUniqueCode();
    }
    LocalDateTime now = LocalDateTime.now();
    GenealogyInviteCode invite = new GenealogyInviteCode();
    invite.setGenealogyId(genealogyId);
    invite.setCode(code);
    invite.setStatus(1);
    invite.setMaxUses(DEFAULT_MAX_USES);
    invite.setUsedCount(0);
    invite.setCreatedBy(createdBy);
    invite.setCreatedAt(now);
    inviteCodeMapper.insert(invite);
    return invite;
  }

  private boolean existsActiveCode(String code) {
    Long c =
        inviteCodeMapper.selectCount(
            new LambdaQueryWrapper<GenealogyInviteCode>()
                .eq(GenealogyInviteCode::getCode, code)
                .eq(GenealogyInviteCode::getStatus, 1));
    return c != null && c > 0;
  }

  private String generateUniqueCode() {
    for (int i = 0; i < 20; i++) {
      String code = randomCode(8);
      if (!existsActiveCode(code)) {
        return code;
      }
    }
    throw new BizException(30007, "邀请码生成失败，请重试");
  }

  private static String randomCode(int len) {
    StringBuilder sb = new StringBuilder(len);
    for (int i = 0; i < len; i++) {
      sb.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
    }
    return sb.toString();
  }

  private InviteCodeResponse toResponse(GenealogyInviteCode invite) {
    return InviteCodeResponse.builder()
        .id(invite.getId())
        .genealogyId(invite.getGenealogyId())
        .code(invite.getCode())
        .status(invite.getStatus())
        .maxUses(invite.getMaxUses())
        .usedCount(invite.getUsedCount() == null ? 0 : invite.getUsedCount())
        .expireAt(DateTimes.format(invite.getExpireAt()))
        .createdBy(invite.getCreatedBy())
        .createdAt(DateTimes.format(invite.getCreatedAt()))
        .revokedAt(DateTimes.format(invite.getRevokedAt()))
        .build();
  }
}
