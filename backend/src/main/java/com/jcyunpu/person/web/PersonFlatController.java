package com.jcyunpu.person.web;

import com.jcyunpu.common.api.ApiResponse;
import com.jcyunpu.common.context.UserContext;
import com.jcyunpu.common.exception.BizException;
import com.jcyunpu.person.dto.PersonFormRequest;
import com.jcyunpu.person.dto.PersonItemResponse;
import com.jcyunpu.person.entity.Person;
import com.jcyunpu.person.mapper.PersonMapper;
import com.jcyunpu.person.service.PersonService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** 兼容前端仅传 personId 的调用（内部回查 genealogyId） */
@RestController
@RequestMapping("/api/persons")
@RequiredArgsConstructor
public class PersonFlatController {

  private final PersonMapper personMapper;
  private final PersonService personService;

  @GetMapping("/{personId}")
  public ApiResponse<PersonItemResponse> detail(@PathVariable Long personId) {
    Person p = requirePerson(personId);
    return ApiResponse.ok(personService.detail(p.getGenealogyId(), personId));
  }

  @PutMapping("/{personId}")
  public ApiResponse<PersonItemResponse> update(
      @PathVariable Long personId, @RequestBody PersonFormRequest req) {
    Person p = requirePerson(personId);
    return ApiResponse.ok(personService.update(p.getGenealogyId(), personId, req));
  }

  @DeleteMapping("/{personId}")
  public ApiResponse<Void> softDelete(@PathVariable Long personId) {
    Person p = requirePerson(personId);
    personService.softDelete(p.getGenealogyId(), personId);
    return ApiResponse.ok();
  }

  @PostMapping("/{personId}/restore")
  public ApiResponse<PersonItemResponse> restore(@PathVariable Long personId) {
    Person p = requirePersonAny(personId);
    return ApiResponse.ok(personService.restore(p.getGenealogyId(), personId));
  }

  @DeleteMapping("/{personId}/purge")
  public ApiResponse<Void> purge(@PathVariable Long personId) {
    Person p = requirePersonAny(personId);
    personService.purge(p.getGenealogyId(), personId);
    return ApiResponse.ok();
  }

  private Person requirePerson(Long personId) {
    Person p = personMapper.selectById(personId);
    if (p == null || (p.getIsDeleted() != null && p.getIsDeleted() == 1)) {
      throw new BizException(23001, "人物不存在");
    }
    if (UserContext.getUserId() == null) {
      throw new BizException(401, "未登录");
    }
    return p;
  }

  private Person requirePersonAny(Long personId) {
    Person p = personMapper.selectById(personId);
    if (p == null) {
      throw new BizException(23001, "人物不存在");
    }
    if (UserContext.getUserId() == null) {
      throw new BizException(401, "未登录");
    }
    return p;
  }
}
