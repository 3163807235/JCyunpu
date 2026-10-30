package com.jcyunpu.genealogy.web;

import com.jcyunpu.common.api.ApiResponse;
import com.jcyunpu.common.api.PageResult;
import com.jcyunpu.genealogy.dto.CreateGenealogyRequest;
import com.jcyunpu.genealogy.dto.GenealogyItemResponse;
import com.jcyunpu.genealogy.dto.UpdateGenealogyRequest;
import com.jcyunpu.genealogy.service.GenealogyService;
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
@RequestMapping("/api/genealogy")
@RequiredArgsConstructor
public class GenealogyController {

  private final GenealogyService genealogyService;

  @GetMapping("/list")
  public ApiResponse<PageResult<GenealogyItemResponse>> list(
      @RequestParam(required = false, defaultValue = "1") long current,
      @RequestParam(required = false, defaultValue = "20") long size,
      @RequestParam(required = false) String keyword,
      @RequestParam(required = false, defaultValue = "active") String scope) {
    return ApiResponse.ok(genealogyService.list(scope, keyword, current, size));
  }

  @GetMapping("/trash")
  public ApiResponse<PageResult<GenealogyItemResponse>> trash(
      @RequestParam(required = false, defaultValue = "1") long current,
      @RequestParam(required = false, defaultValue = "20") long size) {
    return ApiResponse.ok(genealogyService.trashList(current, size));
  }

  @PostMapping
  public ApiResponse<GenealogyItemResponse> create(@Valid @RequestBody CreateGenealogyRequest req) {
    return ApiResponse.ok(genealogyService.create(req));
  }

  @GetMapping("/{id}")
  public ApiResponse<GenealogyItemResponse> detail(@PathVariable Long id) {
    return ApiResponse.ok(genealogyService.detail(id));
  }

  @PutMapping("/{id}")
  public ApiResponse<GenealogyItemResponse> update(
      @PathVariable Long id, @RequestBody UpdateGenealogyRequest req) {
    return ApiResponse.ok(genealogyService.update(id, req));
  }

  @PostMapping("/{id}/trash")
  public ApiResponse<Void> trashOne(@PathVariable Long id) {
    genealogyService.trash(id);
    return ApiResponse.ok();
  }

  @PostMapping("/{id}/restore")
  public ApiResponse<GenealogyItemResponse> restore(@PathVariable Long id) {
    return ApiResponse.ok(genealogyService.restore(id));
  }

  @DeleteMapping("/{id}")
  public ApiResponse<Void> purge(@PathVariable Long id) {
    genealogyService.purge(id);
    return ApiResponse.ok();
  }
}
