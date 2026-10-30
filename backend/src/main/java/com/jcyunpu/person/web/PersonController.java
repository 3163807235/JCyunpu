package com.jcyunpu.person.web;

import com.jcyunpu.common.api.ApiResponse;
import com.jcyunpu.common.api.PageResult;
import com.jcyunpu.person.dto.GenerationConfigRequest;
import com.jcyunpu.person.dto.GenerationConfigResponse;
import com.jcyunpu.person.dto.PersonFormRequest;
import com.jcyunpu.person.dto.PersonItemResponse;
import com.jcyunpu.person.service.PersonService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/genealogy/{genealogyId}")
@RequiredArgsConstructor
public class PersonController {

  private final PersonService personService;

  @GetMapping("/generation-config")
  public ApiResponse<GenerationConfigResponse> getGenerationConfig(
      @PathVariable Long genealogyId) {
    return ApiResponse.ok(personService.getGenerationConfig(genealogyId));
  }

  @PutMapping("/generation-config")
  public ApiResponse<GenerationConfigResponse> saveGenerationConfig(
      @PathVariable Long genealogyId, @Valid @RequestBody GenerationConfigRequest req) {
    return ApiResponse.ok(personService.saveGenerationConfig(genealogyId, req));
  }

  @GetMapping("/persons")
  public ApiResponse<PageResult<PersonItemResponse>> list(
      @PathVariable Long genealogyId,
      @RequestParam(required = false, defaultValue = "1") long current,
      @RequestParam(required = false, defaultValue = "20") long size,
      @RequestParam(required = false) String keyword,
      @RequestParam(required = false) Integer generation,
      @RequestParam(required = false) Integer gender,
      @RequestParam(required = false) Integer isAlive,
      @RequestParam(required = false, defaultValue = "active") String scope,
      @RequestParam(required = false, defaultValue = "lineage") String lineageScope) {
    return ApiResponse.ok(
        personService.list(
            genealogyId, current, size, keyword, generation, gender, isAlive, scope, lineageScope));
  }

  @GetMapping("/persons/search")
  public ApiResponse<PageResult<PersonItemResponse>> search(
      @PathVariable Long genealogyId,
      @RequestParam(required = false) String keyword,
      @RequestParam(required = false, defaultValue = "1") long current,
      @RequestParam(required = false, defaultValue = "20") long size) {
    return ApiResponse.ok(
        personService.list(genealogyId, current, size, keyword, null, null, null, "active", "all"));
  }

  @PostMapping("/persons")
  public ApiResponse<PersonItemResponse> create(
      @PathVariable Long genealogyId, @Valid @RequestBody PersonFormRequest req) {
    return ApiResponse.ok(personService.create(genealogyId, req));
  }

  @GetMapping("/persons/{personId}")
  public ApiResponse<PersonItemResponse> detail(
      @PathVariable Long genealogyId, @PathVariable Long personId) {
    return ApiResponse.ok(personService.detail(genealogyId, personId));
  }

  @PutMapping("/persons/{personId}")
  public ApiResponse<PersonItemResponse> update(
      @PathVariable Long genealogyId,
      @PathVariable Long personId,
      @RequestBody PersonFormRequest req) {
    return ApiResponse.ok(personService.update(genealogyId, personId, req));
  }

  @DeleteMapping("/persons/{personId}")
  public ApiResponse<Void> softDelete(
      @PathVariable Long genealogyId, @PathVariable Long personId) {
    personService.softDelete(genealogyId, personId);
    return ApiResponse.ok();
  }

  @PostMapping("/persons/{personId}/restore")
  public ApiResponse<PersonItemResponse> restore(
      @PathVariable Long genealogyId, @PathVariable Long personId) {
    return ApiResponse.ok(personService.restore(genealogyId, personId));
  }

  @DeleteMapping("/persons/{personId}/purge")
  public ApiResponse<Void> purge(
      @PathVariable Long genealogyId, @PathVariable Long personId) {
    personService.purge(genealogyId, personId);
    return ApiResponse.ok();
  }
}
