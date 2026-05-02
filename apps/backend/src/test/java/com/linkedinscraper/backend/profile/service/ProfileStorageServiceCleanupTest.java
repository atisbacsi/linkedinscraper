package com.linkedinscraper.backend.profile.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootTest
class ProfileStorageServiceCleanupTest {

  @Autowired
  private JdbcTemplate jdbcTemplate;

  @Autowired
  private ObjectMapper objectMapper;

  @Autowired
  private ProfileStorageService storageService;

  @BeforeEach
  void clearTable() {
    jdbcTemplate.update("DELETE FROM profiles");
  }

  @Test
  void canonicalizeAndMergeProfileUrls_mergesVariantUrlsIntoCanonicalEntry() throws Exception {
    String canonicalUrl = "https://www.linkedin.com/in/techworldofflorian/";
    String variantUrl = "https://www.linkedin.com/in/techworldofflorian/?locale=de";

    Map<String, Object> canonicalData =
        Map.of(
            "Name", "Florian",
            "Experiences", List.of("Engineer at One"),
            "LastUpdatedAt", "2026-05-02T10:00:00Z");

    Map<String, Object> variantData =
        Map.of(
            "Headline", "Backend Engineer",
            "Experiences", List.of("Engineer at One", "Senior Engineer at Two"),
            "LastUpdatedAt", "2026-05-02T12:00:00Z");

    jdbcTemplate.update(
        "INSERT INTO profiles (profile_url, data_json, updated_at) VALUES (?, ?, ?)",
        canonicalUrl,
        objectMapper.writeValueAsString(canonicalData),
        canonicalData.get("LastUpdatedAt"));

    jdbcTemplate.update(
        "INSERT INTO profiles (profile_url, data_json, updated_at) VALUES (?, ?, ?)",
        variantUrl,
        objectMapper.writeValueAsString(variantData),
        variantData.get("LastUpdatedAt"));

    ProfileStorageService.UrlCleanupResult result = storageService.canonicalizeAndMergeProfileUrls();

    assertEquals(2, result.scannedProfiles());
    assertEquals(1, result.canonicalProfiles());
    assertEquals(1, result.normalizedProfiles());
    assertEquals(1, result.mergedProfiles());

    Map<String, Map<String, Object>> allProfiles = storageService.listProfiles();
    assertEquals(1, allProfiles.size());
    assertTrue(allProfiles.containsKey(canonicalUrl));

    Map<String, Object> merged = allProfiles.get(canonicalUrl);
    assertEquals("Florian", merged.get("Name"));
    assertEquals("Backend Engineer", merged.get("Headline"));
    assertEquals(List.of("Engineer at One", "Senior Engineer at Two"), merged.get("Experiences"));
    assertEquals("2026-05-02T12:00:00Z", merged.get("LastUpdatedAt"));

    Instant updatedAtInTable =
        jdbcTemplate.queryForObject(
            "SELECT updated_at FROM profiles WHERE profile_url = ?",
            (rs, rowNum) -> Instant.parse(rs.getString("updated_at")),
            canonicalUrl);
    assertEquals(Instant.parse("2026-05-02T12:00:00Z"), updatedAtInTable);
  }
}
