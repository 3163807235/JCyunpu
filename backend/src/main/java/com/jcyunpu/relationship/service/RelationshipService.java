package com.jcyunpu.relationship.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.jcyunpu.common.context.UserContext;
import com.jcyunpu.common.exception.BizException;
import com.jcyunpu.common.util.DateTimes;
import com.jcyunpu.genealogy.service.GenealogyAccessService;
import com.jcyunpu.person.entity.Person;
import com.jcyunpu.person.mapper.PersonMapper;
import com.jcyunpu.relationship.dto.RelationCreateRequest;
import com.jcyunpu.relationship.dto.RelationItemResponse;
import com.jcyunpu.relationship.entity.Relationship;
import com.jcyunpu.relationship.mapper.RelationshipMapper;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class RelationshipService {

  private static final Set<String> FATHER_TYPES =
      Set.of("father", "sifu", "jiantiao", "jifu", "yifu");
  private static final Set<String> ALL_TYPES =
      Set.of(
          "father",
          "sifu",
          "jiantiao",
          "jifu",
          "yifu",
          "mother",
          "spouse",
          "zhuixu",
          "chuji");

  private final RelationshipMapper relationshipMapper;
  private final PersonMapper personMapper;
  private final GenealogyAccessService accessService;

  public List<RelationItemResponse> list(Long genealogyId) {
    Long userId = requireUserId();
    accessService.requireActiveAccessible(genealogyId, userId);
    return relationshipMapper
        .selectList(
            new LambdaQueryWrapper<Relationship>()
                .eq(Relationship::getGenealogyId, genealogyId)
                .eq(Relationship::getIsDeleted, 0)
                .orderByDesc(Relationship::getId))
        .stream()
        .map(this::toResponse)
        .toList();
  }

  @Transactional
  public List<RelationItemResponse> create(RelationCreateRequest req) {
    Long userId = requireUserId();
    Long genealogyId = req.getGenealogyId();
    accessService.requireActiveWritable(genealogyId, userId);
    String relType = normalizeType(req.getRelType());
    if (req.getFromPersonId().equals(req.getToPersonId())) {
      throw new BizException(24001, "不能与自己建立关系");
    }
    requireActivePerson(genealogyId, req.getFromPersonId());
    requireActivePerson(genealogyId, req.getToPersonId());
    assertNotExists(genealogyId, req.getFromPersonId(), req.getToPersonId(), relType);

    LocalDateTime now = LocalDateTime.now();
    List<RelationItemResponse> out = new ArrayList<>();
    Relationship base = insertOne(genealogyId, req.getFromPersonId(), req.getToPersonId(), relType, req.getRemark(), userId, now);
    out.add(toResponse(base));

    if ("spouse".equals(relType) || "zhuixu".equals(relType)) {
      assertNotExists(genealogyId, req.getToPersonId(), req.getFromPersonId(), relType);
      Relationship reverse =
          insertOne(
              genealogyId,
              req.getToPersonId(),
              req.getFromPersonId(),
              relType,
              req.getRemark(),
              userId,
              now);
      out.add(toResponse(reverse));
    }
    return out;
  }

  @Transactional
  public void deleteById(Long relationId) {
    Relationship r = relationshipMapper.selectById(relationId);
    if (r == null || (r.getIsDeleted() != null && r.getIsDeleted() == 1)) {
      throw new BizException(24002, "关系不存在");
    }
    delete(r.getGenealogyId(), relationId);
  }

  @Transactional
  public void delete(Long genealogyId, Long relationId) {
    Long userId = requireUserId();
    accessService.requireActiveWritable(genealogyId, userId);
    Relationship r = relationshipMapper.selectById(relationId);
    if (r == null || !genealogyId.equals(r.getGenealogyId()) || (r.getIsDeleted() != null && r.getIsDeleted() == 1)) {
      throw new BizException(24002, "关系不存在");
    }
    LocalDateTime now = LocalDateTime.now();
    softDelete(r, userId, now);

    if ("spouse".equals(r.getRelType()) || "zhuixu".equals(r.getRelType())) {
      Relationship reverse =
          relationshipMapper.selectOne(
              new LambdaQueryWrapper<Relationship>()
                  .eq(Relationship::getGenealogyId, genealogyId)
                  .eq(Relationship::getFromPersonId, r.getToPersonId())
                  .eq(Relationship::getToPersonId, r.getFromPersonId())
                  .eq(Relationship::getRelType, r.getRelType())
                  .eq(Relationship::getIsDeleted, 0)
                  .last("LIMIT 1"));
      if (reverse != null) {
        softDelete(reverse, userId, now);
      }
    }
  }

  /** 更改父节点：软删旧父类边，新建 father 边 */
  @Transactional
  public List<RelationItemResponse> setFather(Long genealogyId, Long childId, Long fatherId, String remark) {
    Long userId = requireUserId();
    accessService.requireActiveWritable(genealogyId, userId);
    if (childId.equals(fatherId)) {
      throw new BizException(24001, "不能与自己建立关系");
    }
    requireActivePerson(genealogyId, childId);
    requireActivePerson(genealogyId, fatherId);

    LocalDateTime now = LocalDateTime.now();
    List<Relationship> olds =
        relationshipMapper.selectList(
            new LambdaQueryWrapper<Relationship>()
                .eq(Relationship::getGenealogyId, genealogyId)
                .eq(Relationship::getFromPersonId, childId)
                .eq(Relationship::getIsDeleted, 0)
                .in(Relationship::getRelType, FATHER_TYPES));
    for (Relationship old : olds) {
      softDelete(old, userId, now);
    }

    Relationship created =
        insertOne(genealogyId, childId, fatherId, "father", remark, userId, now);
    return List.of(toResponse(created));
  }

  private Relationship insertOne(
      Long genealogyId,
      Long from,
      Long to,
      String relType,
      String remark,
      Long userId,
      LocalDateTime now) {
    Relationship r = new Relationship();
    r.setGenealogyId(genealogyId);
    r.setFromPersonId(from);
    r.setToPersonId(to);
    r.setRelType(relType);
    r.setIsPrimary(1);
    r.setRemark(trimToNull(remark));
    r.setCreatedBy(userId);
    r.setUpdatedBy(userId);
    r.setCreatedAt(now);
    r.setUpdatedAt(now);
    r.setIsDeleted(0);
    relationshipMapper.insert(r);
    return r;
  }

  private void softDelete(Relationship r, Long userId, LocalDateTime now) {
    r.setIsDeleted(1);
    r.setUpdatedBy(userId);
    r.setUpdatedAt(now);
    relationshipMapper.updateById(r);
  }

  private void assertNotExists(Long genealogyId, Long from, Long to, String relType) {
    Long c =
        relationshipMapper.selectCount(
            new LambdaQueryWrapper<Relationship>()
                .eq(Relationship::getGenealogyId, genealogyId)
                .eq(Relationship::getFromPersonId, from)
                .eq(Relationship::getToPersonId, to)
                .eq(Relationship::getRelType, relType)
                .eq(Relationship::getIsDeleted, 0));
    if (c != null && c > 0) {
      throw new BizException(24003, "该关系已存在");
    }
  }

  private void requireActivePerson(Long genealogyId, Long personId) {
    Person p = personMapper.selectById(personId);
    if (p == null
        || !genealogyId.equals(p.getGenealogyId())
        || (p.getIsDeleted() != null && p.getIsDeleted() == 1)) {
      throw new BizException(23001, "人物不存在");
    }
  }

  private String normalizeType(String raw) {
    if (!StringUtils.hasText(raw)) {
      throw new BizException(24004, "关系类型无效");
    }
    String t = raw.trim().toLowerCase(Locale.ROOT);
    if (!ALL_TYPES.contains(t)) {
      throw new BizException(24004, "关系类型无效");
    }
    return t;
  }

  private RelationItemResponse toResponse(Relationship r) {
    return RelationItemResponse.builder()
        .id(r.getId())
        .genealogyId(r.getGenealogyId())
        .fromPersonId(r.getFromPersonId())
        .toPersonId(r.getToPersonId())
        .relType(r.getRelType())
        .remark(r.getRemark() == null ? "" : r.getRemark())
        .createdAt(DateTimes.format(r.getCreatedAt()))
        .deletedAt(r.getIsDeleted() != null && r.getIsDeleted() == 1 ? DateTimes.format(r.getUpdatedAt()) : null)
        .build();
  }

  private static String trimToNull(String s) {
    if (!StringUtils.hasText(s)) {
      return null;
    }
    return s.trim();
  }

  private Long requireUserId() {
    Long id = UserContext.getUserId();
    if (id == null) {
      throw new BizException(401, "未登录");
    }
    return id;
  }
}
