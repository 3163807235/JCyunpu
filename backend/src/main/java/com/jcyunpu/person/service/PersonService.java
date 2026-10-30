package com.jcyunpu.person.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.jcyunpu.common.api.PageResult;
import com.jcyunpu.common.context.UserContext;
import com.jcyunpu.common.exception.BizException;
import com.jcyunpu.common.util.DateTimes;
import com.jcyunpu.genealogy.entity.Genealogy;
import com.jcyunpu.genealogy.mapper.GenealogyMapper;
import com.jcyunpu.genealogy.service.GenealogyAccessService;
import com.jcyunpu.person.dto.GenerationConfigRequest;
import com.jcyunpu.person.dto.GenerationConfigResponse;
import com.jcyunpu.person.dto.PersonFormRequest;
import com.jcyunpu.person.dto.PersonItemResponse;
import com.jcyunpu.person.entity.Person;
import com.jcyunpu.person.mapper.PersonMapper;
import com.jcyunpu.quota.service.QuotaService;
import com.jcyunpu.relationship.entity.Relationship;
import com.jcyunpu.relationship.mapper.RelationshipMapper;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class PersonService {

  private static final Set<String> PARENT_RELS =
      Set.of("father", "sifu", "jiantiao", "jifu", "yifu", "mother");

  private final PersonMapper personMapper;
  private final RelationshipMapper relationshipMapper;
  private final GenealogyMapper genealogyMapper;
  private final GenealogyAccessService accessService;
  private final QuotaService quotaService;

  public GenerationConfigResponse getGenerationConfig(Long genealogyId) {
    Long userId = requireUserId();
    Genealogy g = accessService.requireActiveAccessible(genealogyId, userId);
    return GenerationConfigResponse.builder()
        .poem(g.getZibeiPoem() == null ? "" : g.getZibeiPoem())
        .startGen(g.getZibeiStartGen() == null ? 1 : g.getZibeiStartGen())
        .build();
  }

  @Transactional
  public GenerationConfigResponse saveGenerationConfig(Long genealogyId, GenerationConfigRequest req) {
    Long userId = requireUserId();
    Genealogy g = accessService.requireActiveWritable(genealogyId, userId);
    String poem =
        req.getPoem() == null
            ? ""
            : req.getPoem().replaceAll("\\s+", "");
    g.setZibeiPoem(poem);
    g.setZibeiStartGen(req.getStartGen());
    g.setUpdatedAt(LocalDateTime.now());
    genealogyMapper.updateById(g);
    return GenerationConfigResponse.builder().poem(poem).startGen(req.getStartGen()).build();
  }

  public PageResult<PersonItemResponse> list(
      Long genealogyId,
      long current,
      long size,
      String keyword,
      Integer generation,
      Integer gender,
      Integer isAlive,
      String scope,
      String lineageScope) {
    Long userId = requireUserId();
    accessService.requireActiveAccessible(genealogyId, userId);
    boolean trash = "trash".equalsIgnoreCase(scope);

    LambdaQueryWrapper<Person> q =
        new LambdaQueryWrapper<Person>()
            .eq(Person::getGenealogyId, genealogyId)
            .eq(Person::getIsDeleted, trash ? 1 : 0)
            .orderByAsc(Person::getGeneration)
            .orderByAsc(Person::getId);
    if (generation != null) {
      q.eq(Person::getGeneration, generation);
    }
    if (gender != null) {
      q.eq(Person::getGender, gender);
    }
    if (isAlive != null) {
      q.eq(Person::getIsAlive, isAlive);
    }
    if (StringUtils.hasText(keyword)) {
      String kw = keyword.trim();
      q.and(
          w ->
              w.like(Person::getNameWei, kw)
                  .or()
                  .like(Person::getNameZi, kw)
                  .or()
                  .like(Person::getNameHao, kw)
                  .or()
                  .like(Person::getZibei, kw)
                  .or()
                  .like(Person::getPersonNo, kw));
    }

    // lineage 过滤需关系，先取较大集合再内存分页（MVP 一期目标 ≤500）
    String ls = lineageScope == null ? "lineage" : lineageScope.trim().toLowerCase(Locale.ROOT);
    if (!"all".equals(ls) && !trash) {
      List<Person> all = personMapper.selectList(q);
      Set<Long> withParent = loadParentPersonIds(genealogyId);
      List<Person> filtered =
          all.stream()
              .filter(p -> {
                boolean affinal = isAffinal(p, withParent);
                if ("affinal".equals(ls)) return affinal;
                return !affinal; // lineage
              })
              .collect(Collectors.toList());
      long total = filtered.size();
      long from = Math.max(0, (current - 1) * size);
      List<PersonItemResponse> page =
          filtered.stream().skip(from).limit(size).map(this::toResponse).toList();
      return new PageResult<>(current, size, total, page);
    }

    Page<Person> page = personMapper.selectPage(new Page<>(current, size), q);
    return new PageResult<>(
        page.getCurrent(),
        page.getSize(),
        page.getTotal(),
        page.getRecords().stream().map(this::toResponse).toList());
  }

  public PersonItemResponse detail(Long genealogyId, Long personId) {
    Long userId = requireUserId();
    accessService.requireActiveAccessible(genealogyId, userId);
    Person p = requirePerson(genealogyId, personId, false);
    return toResponse(p);
  }

  @Transactional
  public PersonItemResponse create(Long genealogyId, PersonFormRequest req) {
    Long userId = requireUserId();
    Genealogy g = accessService.requireActiveWritable(genealogyId, userId);
    quotaService.requireActiveSubscription(g.getTenantId());
    quotaService.consumePerson(g.getTenantId(), genealogyId, userId, 1);

    LocalDateTime now = LocalDateTime.now();
    Person p = new Person();
    applyForm(p, req);
    p.setGenealogyId(genealogyId);
    p.setPersonNo(resolvePersonNo(genealogyId, req.getPersonNo()));
    p.setReviewStatus(0);
    p.setIsChangedSinceArchive(0);
    p.setCreatedBy(userId);
    p.setUpdatedBy(userId);
    p.setCreatedAt(now);
    p.setUpdatedAt(now);
    p.setIsDeleted(0);
    personMapper.insert(p);
    if (!StringUtils.hasText(req.getPersonNo())) {
      p.setPersonNo(String.format("P-%06d", p.getId()));
      personMapper.updateById(p);
    }
    return toResponse(p);
  }

  @Transactional
  public PersonItemResponse update(Long genealogyId, Long personId, PersonFormRequest req) {
    Long userId = requireUserId();
    accessService.requireActiveWritable(genealogyId, userId);
    Person p = requirePerson(genealogyId, personId, false);
    applyFormPatch(p, req);
    if (p.getReviewStatus() != null && p.getReviewStatus() == 1) {
      p.setReviewStatus(0);
    }
    p.setUpdatedBy(userId);
    p.setUpdatedAt(LocalDateTime.now());
    personMapper.updateById(p);
    return toResponse(p);
  }

  @Transactional
  public void softDelete(Long genealogyId, Long personId) {
    Long userId = requireUserId();
    accessService.requireActiveWritable(genealogyId, userId);
    Person p = requirePerson(genealogyId, personId, false);
    LocalDateTime now = LocalDateTime.now();
    p.setIsDeleted(1);
    p.setDeletedAt(now);
    p.setUpdatedBy(userId);
    p.setUpdatedAt(now);
    personMapper.updateById(p);
  }

  @Transactional
  public PersonItemResponse restore(Long genealogyId, Long personId) {
    Long userId = requireUserId();
    Genealogy g = accessService.requireActiveWritable(genealogyId, userId);
    quotaService.requireActiveSubscription(g.getTenantId());
    Person p = requirePerson(genealogyId, personId, true);
    if (p.getIsDeleted() == null || p.getIsDeleted() != 1) {
      throw new BizException(23005, "人物不在回收站");
    }
    // 软删仍占额度，恢复不额外扣减
    p.setIsDeleted(0);
    p.setDeletedAt(null);
    p.setUpdatedBy(userId);
    p.setUpdatedAt(LocalDateTime.now());
    personMapper.updateById(p);
    return toResponse(p);
  }

  @Transactional
  public void purge(Long genealogyId, Long personId) {
    Long userId = requireUserId();
    Genealogy g = accessService.requireActiveWritable(genealogyId, userId);
    Person p = requirePerson(genealogyId, personId, true);
    if (p.getIsDeleted() == null || p.getIsDeleted() != 1) {
      throw new BizException(23006, "请先移入回收站再彻底删除");
    }
    personMapper.deleteById(p.getId());
    quotaService.releasePerson(g.getTenantId(), genealogyId, userId, 1);
  }

  private Person requirePerson(Long genealogyId, Long personId, boolean allowTrash) {
    Person p = personMapper.selectById(personId);
    if (p == null || !genealogyId.equals(p.getGenealogyId())) {
      throw new BizException(23001, "人物不存在");
    }
    if (!allowTrash && p.getIsDeleted() != null && p.getIsDeleted() == 1) {
      throw new BizException(23001, "人物不存在");
    }
    return p;
  }

  private void applyForm(Person p, PersonFormRequest req) {
    p.setNameWei(req.getNameWei().trim());
    p.setNameZi(trimToNull(req.getNameZi()));
    p.setNameHao(trimToNull(req.getNameHao()));
    p.setXingdi(trimToNull(req.getXingdi()));
    p.setZibei(trimToNull(req.getZibei()));
    p.setGeneration(req.getGeneration());
    p.setGender(req.getGender());
    p.setBirthDate(trimToNull(req.getBirthDate()));
    p.setDeathDate(trimToNull(req.getDeathDate()));
    p.setIsAlive(Boolean.TRUE.equals(req.getIsYoushang()) ? 0 : req.getIsAlive());
    p.setIsYoushang(Boolean.TRUE.equals(req.getIsYoushang()) ? 1 : 0);
    p.setNativePlace(trimToNull(req.getNativePlace()));
    p.setBurialPlace(trimToNull(req.getBurialPlace()));
    p.setBiography(trimToNull(req.getBiography()));
    p.setPrivacyLevel(req.getPrivacyLevel());
    p.setZibeiDoubt(Boolean.TRUE.equals(req.getZibeiDoubt()) ? 1 : 0);
    if (Boolean.TRUE.equals(req.getZibeiDoubt())) {
      p.setReviewStatus(2);
      if (!StringUtils.hasText(p.getReviewNote())) {
        p.setReviewNote("字辈与派语不匹配，存疑");
      }
    }
  }

  /** 局部更新：仅覆盖请求中非 null 字段 */
  private void applyFormPatch(Person p, PersonFormRequest req) {
    if (req.getNameWei() != null) {
      if (!StringUtils.hasText(req.getNameWei())) {
        throw new BizException(23003, "讳名不能为空");
      }
      p.setNameWei(req.getNameWei().trim());
    }
    if (req.getNameZi() != null) p.setNameZi(trimToNull(req.getNameZi()));
    if (req.getNameHao() != null) p.setNameHao(trimToNull(req.getNameHao()));
    if (req.getXingdi() != null) p.setXingdi(trimToNull(req.getXingdi()));
    if (req.getZibei() != null) p.setZibei(trimToNull(req.getZibei()));
    if (req.getGeneration() != null) p.setGeneration(req.getGeneration());
    if (req.getGender() != null) p.setGender(req.getGender());
    if (req.getBirthDate() != null) p.setBirthDate(trimToNull(req.getBirthDate()));
    if (req.getDeathDate() != null) p.setDeathDate(trimToNull(req.getDeathDate()));
    if (req.getIsAlive() != null) p.setIsAlive(req.getIsAlive());
    if (req.getIsYoushang() != null) {
      p.setIsYoushang(Boolean.TRUE.equals(req.getIsYoushang()) ? 1 : 0);
      if (Boolean.TRUE.equals(req.getIsYoushang())) p.setIsAlive(0);
    }
    if (req.getNativePlace() != null) p.setNativePlace(trimToNull(req.getNativePlace()));
    if (req.getBurialPlace() != null) p.setBurialPlace(trimToNull(req.getBurialPlace()));
    if (req.getBiography() != null) p.setBiography(trimToNull(req.getBiography()));
    if (req.getPrivacyLevel() != null) p.setPrivacyLevel(req.getPrivacyLevel());
    if (req.getZibeiDoubt() != null) {
      p.setZibeiDoubt(Boolean.TRUE.equals(req.getZibeiDoubt()) ? 1 : 0);
      if (Boolean.TRUE.equals(req.getZibeiDoubt())) {
        p.setReviewStatus(2);
        if (!StringUtils.hasText(p.getReviewNote())) {
          p.setReviewNote("字辈与派语不匹配，存疑");
        }
      }
    }
  }

  private String resolvePersonNo(Long genealogyId, String preferred) {
    if (StringUtils.hasText(preferred)) {
      String no = preferred.trim();
      Long c =
          personMapper.selectCount(
              new LambdaQueryWrapper<Person>()
                  .eq(Person::getGenealogyId, genealogyId)
                  .eq(Person::getPersonNo, no));
      if (c != null && c > 0) {
        throw new BizException(23002, "人物编号已存在");
      }
      return no;
    }
    return "TMP-" + System.currentTimeMillis();
  }

  private Set<Long> loadParentPersonIds(Long genealogyId) {
    List<Relationship> rels =
        relationshipMapper.selectList(
            new LambdaQueryWrapper<Relationship>()
                .eq(Relationship::getGenealogyId, genealogyId)
                .eq(Relationship::getIsDeleted, 0)
                .in(Relationship::getRelType, PARENT_RELS));
    Set<Long> ids = new HashSet<>();
    for (Relationship r : rels) {
      ids.add(r.getFromPersonId());
    }
    return ids;
  }

  /** 无本族父/母边且非男 → 姻亲 */
  private boolean isAffinal(Person p, Set<Long> withParent) {
    if (withParent.contains(p.getId())) {
      return false;
    }
    return p.getGender() == null || p.getGender() != 1;
  }

  private PersonItemResponse toResponse(Person p) {
    return PersonItemResponse.builder()
        .id(p.getId())
        .genealogyId(p.getGenealogyId())
        .projectId(p.getProjectId())
        .personNo(p.getPersonNo())
        .generation(p.getGeneration())
        .nameWei(p.getNameWei() == null ? "" : p.getNameWei())
        .nameZi(p.getNameZi())
        .nameHao(p.getNameHao())
        .xingdi(p.getXingdi())
        .zibei(p.getZibei())
        .gender(p.getGender() == null ? 0 : p.getGender())
        .birthDate(p.getBirthDate())
        .deathDate(p.getDeathDate())
        .isAlive(p.getIsAlive() == null ? 1 : p.getIsAlive())
        .isYoushang(p.getIsYoushang() != null && p.getIsYoushang() == 1)
        .nativePlace(p.getNativePlace())
        .burialPlace(p.getBurialPlace())
        .biography(p.getBiography())
        .privacyLevel(p.getPrivacyLevel() == null ? 1 : p.getPrivacyLevel())
        .reviewStatus(p.getReviewStatus() == null ? 0 : p.getReviewStatus())
        .reviewNote(p.getReviewNote())
        .isChangedSinceArchive(
            p.getIsChangedSinceArchive() == null ? 0 : p.getIsChangedSinceArchive())
        .zibeiDoubt(p.getZibeiDoubt() != null && p.getZibeiDoubt() == 1)
        .createdAt(DateTimes.format(p.getCreatedAt()))
        .updatedAt(DateTimes.format(p.getUpdatedAt()))
        .deletedAt(DateTimes.format(p.getDeletedAt()))
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
