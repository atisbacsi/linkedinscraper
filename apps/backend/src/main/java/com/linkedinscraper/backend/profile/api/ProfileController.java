package com.linkedinscraper.backend.profile.api;

import com.linkedinscraper.backend.profile.service.ProfileFieldPolicy;
import com.linkedinscraper.backend.profile.service.ProfileStorageService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import org.springframework.http.HttpHeaders;
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
import org.springframework.web.bind.annotation.CrossOrigin;

@RestController
@RequestMapping(produces = MediaType.APPLICATION_JSON_VALUE)
@CrossOrigin(originPatterns = "*")
@Validated
public class ProfileController {

  private final ProfileStorageService storageService;

  public ProfileController(ProfileStorageService storageService) {
    this.storageService = storageService;
  }

  @GetMapping("/profiles")
  public ResponseEntity<Object> listProfiles() {
    return ResponseEntity.ok(storageService.listProfiles());
  }

  @GetMapping("/profiles/{profileUrl}")
  public ResponseEntity<Object> getProfile(@PathVariable String profileUrl) {
    String normalizedProfileUrl = normalizeProfileUrl(profileUrl);
    return storageService
      .getProfile(normalizedProfileUrl)
        .<ResponseEntity<Object>>map(ResponseEntity::ok)
        .orElseGet(() -> notFound("Profile not found"));
  }

  @DeleteMapping("/profiles/{profileUrl}")
  public ResponseEntity<Object> deleteProfile(@PathVariable String profileUrl) {
    String normalizedProfileUrl = normalizeProfileUrl(profileUrl);
    boolean deleted = storageService.deleteProfile(normalizedProfileUrl);
    if (!deleted) {
      return notFound("Profile not found");
    }
    return ResponseEntity.noContent().build();
  }

  @PutMapping("/profiles/{profileUrl}/fields/{fieldName}")
  public ResponseEntity<Object> saveField(
      @PathVariable String profileUrl,
      @PathVariable String fieldName,
      @Valid @RequestBody FieldValueRequest request) {
    String normalizedProfileUrl = normalizeProfileUrl(profileUrl);
    if (!ProfileFieldPolicy.isAllowedScalarField(fieldName)) {
      return badRequest("Invalid field name");
    }

    return ResponseEntity.ok(
        storageService.saveField(normalizedProfileUrl, fieldName, request.value().trim()));
  }

  @DeleteMapping("/profiles/{profileUrl}/fields/{fieldName}")
  public ResponseEntity<Object> deleteField(
      @PathVariable String profileUrl,
      @PathVariable String fieldName) {
    String normalizedProfileUrl = normalizeProfileUrl(profileUrl);
    if (!ProfileFieldPolicy.isAllowedScalarField(fieldName)) {
      return badRequest("Invalid field name");
    }

    return storageService
        .deleteField(normalizedProfileUrl, fieldName)
        .<ResponseEntity<Object>>map(ResponseEntity::ok)
        .orElseGet(() -> notFound("Profile or field not found"));
  }

  @PostMapping("/profiles/{profileUrl}/experiences")
  public ResponseEntity<Object> addExperience(
      @PathVariable String profileUrl,
      @Valid @RequestBody FieldValueRequest request) {
    String normalizedProfileUrl = normalizeProfileUrl(profileUrl);
    return ResponseEntity.ok(
        storageService.addExperience(normalizedProfileUrl, request.value().trim()));
  }

  @DeleteMapping("/profiles/{profileUrl}/experiences")
  public ResponseEntity<Object> clearExperiences(@PathVariable String profileUrl) {
    String normalizedProfileUrl = normalizeProfileUrl(profileUrl);
    return storageService
      .clearExperiences(normalizedProfileUrl)
        .<ResponseEntity<Object>>map(ResponseEntity::ok)
        .orElseGet(() -> notFound("Profile not found"));
  }

  @DeleteMapping("/profiles/{profileUrl}/experiences/{index}")
  public ResponseEntity<Object> deleteExperience(
      @PathVariable String profileUrl,
      @PathVariable @Min(0) int index) {
    String normalizedProfileUrl = normalizeProfileUrl(profileUrl);
    return storageService
      .deleteExperience(normalizedProfileUrl, index)
        .<ResponseEntity<Object>>map(ResponseEntity::ok)
        .orElseGet(() -> notFound("Profile or experience entry not found"));
  }

  @GetMapping("/export")
  public ResponseEntity<Object> exportJson() {
    String timestamp = DateTimeFormatter.ISO_INSTANT.format(Instant.now()).replace(":", "-");
    String filename = "linkedin-profiles-" + timestamp + ".json";

    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
      .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
        .body(storageService.listProfiles());
  }

  private ResponseEntity<Object> notFound(String message) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", message));
  }

  private ResponseEntity<Object> badRequest(String message) {
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", message));
  }

  private String normalizeProfileUrl(String profileUrl) {
    String decodedOnce = URLDecoder.decode(profileUrl, StandardCharsets.UTF_8);
    String decodedTwice = URLDecoder.decode(decodedOnce, StandardCharsets.UTF_8);

    if (looksLikeHttpUrl(decodedTwice)) {
      return stripQueryAndFragment(decodedTwice);
    }

    return stripQueryAndFragment(decodedOnce);
  }

  private boolean looksLikeHttpUrl(String value) {
    return value.startsWith("http://") || value.startsWith("https://");
  }

  private String stripQueryAndFragment(String value) {
    if (!looksLikeHttpUrl(value)) {
      return value;
    }

    try {
      URI parsed = URI.create(value);
      URI withoutQueryAndFragment = new URI(
          parsed.getScheme(),
          parsed.getAuthority(),
          parsed.getPath(),
          null,
          null);
      return withoutQueryAndFragment.toString();
    } catch (RuntimeException | java.net.URISyntaxException ex) {
      int queryIndex = value.indexOf('?');
      int fragmentIndex = value.indexOf('#');
      int cutIndex = value.length();
      if (queryIndex >= 0) {
        cutIndex = Math.min(cutIndex, queryIndex);
      }
      if (fragmentIndex >= 0) {
        cutIndex = Math.min(cutIndex, fragmentIndex);
      }
      return value.substring(0, cutIndex);
    }
  }

  public record FieldValueRequest(@NotBlank String value) {}
}
