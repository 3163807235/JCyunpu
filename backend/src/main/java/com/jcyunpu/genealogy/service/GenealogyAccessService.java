package com.jcyunpu.genealogy.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.jcyunpu.collaborator.entity.Collaborator;
import com.jcyunpu.collaborator.mapper.CollaboratorMapper;
import com.jcyunpu.common.exception.BizException;
import com.jcyunpu.genealogy.entity.Genealogy;
import com.jcyunpu.genealogy.mapper.GenealogyMapper;
import com.jcyunpu.member.entity.GenealogyMember;
import com.jcyunpu.member.mapper.GenealogyMemberMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/** 谱访问权：owner > collaborator > member */
@Service
@RequiredArgsConstructor
public class GenealogyAccessService {

  public static final String OWNER = "owner";
  public static final String COLLABORATOR = "collaborator";
  public static final String MEMBER = "member";

  private final GenealogyMapper genealogyMapper;
  private final GenealogyMemberMapper memberMapper;
  private final CollaboratorMapper collaboratorMapper;

  public Genealogy requireActive(Long genealogyId) {
    Genealogy g = genealogyMapper.selectById(genealogyId);
    if (g == null || g.getStatus() == null || g.getStatus() != 1) {
      throw new BizException(21001, "族谱不存在或已删除");
    }
    return g;
  }

  public Genealogy requireOwned(Long genealogyId, Long userId) {
    Genealogy g = genealogyMapper.selectById(genealogyId);
    if (g == null) {
      throw new BizException(21001, "族谱不存在或已删除");
    }
    if (!userId.equals(g.getOwnerUserId())) {
      throw new BizException(21003, "仅族谱拥有者可操作");
    }
    return g;
  }

  /** @return membership；无权则 null */
  public String resolveMembership(Genealogy g, Long userId) {
    if (g == null || userId == null) {
      return null;
    }
    if (userId.equals(g.getOwnerUserId())) {
      return OWNER;
    }
    Collaborator collab =
        collaboratorMapper.selectOne(
            new LambdaQueryWrapper<Collaborator>()
                .eq(Collaborator::getGenealogyId, g.getId())
                .eq(Collaborator::getUserId, userId)
                .eq(Collaborator::getInviteStatus, 1)
                .last("LIMIT 1"));
    if (collab != null) {
      return COLLABORATOR;
    }
    GenealogyMember member =
        memberMapper.selectOne(
            new LambdaQueryWrapper<GenealogyMember>()
                .eq(GenealogyMember::getGenealogyId, g.getId())
                .eq(GenealogyMember::getUserId, userId)
                .eq(GenealogyMember::getStatus, 1)
                .last("LIMIT 1"));
    if (member != null) {
      return MEMBER;
    }
    return null;
  }

  public String requireAccess(Genealogy g, Long userId) {
    String m = resolveMembership(g, userId);
    if (m == null) {
      throw new BizException(21002, "无权访问该族谱");
    }
    return m;
  }

  /** 可写：拥有者或协作（L1 成员只读） */
  public String requireWritable(Genealogy g, Long userId) {
    String m = requireAccess(g, userId);
    if (MEMBER.equals(m)) {
      throw new BizException(21004, "族谱成员为只读，无法修改");
    }
    return m;
  }

  public Genealogy requireActiveWritable(Long genealogyId, Long userId) {
    Genealogy g = requireActive(genealogyId);
    requireWritable(g, userId);
    return g;
  }

  public Genealogy requireActiveAccessible(Long genealogyId, Long userId) {
    Genealogy g = requireActive(genealogyId);
    requireAccess(g, userId);
    return g;
  }
}
