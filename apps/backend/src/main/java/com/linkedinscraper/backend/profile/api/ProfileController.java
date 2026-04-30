package com.linkedinscraper.backend.profile.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/v1", produces = MediaType.APPLICATION_JSON_VALUE)
@Validated
public class ProfileController {

  @GetMapping("/profiles")
  public ResponseEntity<Object> listProfiles() {
    return notImplemented("Profile listing is not implemented yet.");
  }

  @GetMapping("/profiles/{profileUrl}")
  public ResponseEntity<Object> getProfile(@PathVariable String profileUrl) {
    return notImplemented("Profile lookup is not implemented yet.");
  }

  @DeleteMapping("/profiles/{profileUrl}")
  public ResponseEntity<Object> deleteProfile(@PathVariable String profileUrl) {
    return notImplemented("Profile deletion is not implemented yet.");
  }

  @PutMapping("/profiles/{profileUrl}/fields/{fieldName}")
  public ResponseEntity<Object> saveField(
      @PathVariable String profileUrl,
      @PathVariable String fieldName,
      @Valid @RequestBody FieldValueRequest request) {
    return notImplemented("Field storage is not implemented yet.");
  }

  @DeleteMapping("/profiles/{profileUrl}/fields/{fieldName}")
  public ResponseEntity<Object> deleteField(
      @PathVariable String profileUrl,
      @PathVariable String fieldName) {
    return notImplemented("Field deletion is not implemented yet.");
  }

  @PostMapping("/profiles/{profileUrl}/experiences")
  public ResponseEntity<Object> addExperience(
      @PathVariable String profileUrl,
      @Valid @RequestBody FieldValueRequest request) {
    return notImplemented("Experience storage is not implemented yet.");
  }

  @DeleteMapping("/profiles/{profileUrl}/experiences")
  public ResponseEntity<Object> clearExperiences(@PathVariable String profileUrl) {
    return notImplemented("Experience clearing is not implemented yet.");
  }

  @DeleteMapping("/profiles/{profileUrl}/experiences/{index}")
  public ResponseEntity<Object> deleteExperience(
      @PathVariable String profileUrl,
      @PathVariable @Min(0) int index) {
    return notImplemented("Experience deletion is not implemented yet.");
  }

  @GetMapping("/export")
  public ResponseEntity<Object> exportJson() {
    return notImplemented("JSON export is not implemented yet.");
  }

  private ResponseEntity<Object> notImplemented(String message) {
    return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body(Map.of("error", message));
  }

  public record FieldValueRequest(@NotBlank String value) {}
}
