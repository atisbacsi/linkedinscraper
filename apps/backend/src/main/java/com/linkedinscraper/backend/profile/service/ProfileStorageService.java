package com.linkedinscraper.backend.profile.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class ProfileStorageService {

  private static final String EXPERIENCE_KEY = "Experiences";
  private static final String LAST_UPDATED_KEY = "LastUpdatedAt";

  private final JdbcTemplate jdbcTemplate;
  private final ObjectMapper objectMapper;

  public ProfileStorageService(JdbcTemplate jdbcTemplate, ObjectMapper objectMapper) {
    this.jdbcTemplate = jdbcTemplate;
    this.objectMapper = objectMapper;
  }

  @PostConstruct
  void initSchema() {
    jdbcTemplate.execute(
        """
        CREATE TABLE IF NOT EXISTS profiles (
          profile_url TEXT PRIMARY KEY,
          data_json TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
        """);
  }

  public Map<String, Map<String, Object>> listProfiles() {
    List<Map<String, Object>> rows =
        jdbcTemplate.queryForList("SELECT profile_url, data_json FROM profiles ORDER BY profile_url");

    Map<String, Map<String, Object>> response = new LinkedHashMap<>();
    for (Map<String, Object> row : rows) {
      String profileUrl = (String) row.get("profile_url");
      String dataJson = (String) row.get("data_json");
      response.put(profileUrl, readJsonMap(dataJson));
    }
    return response;
  }

  public Optional<Map<String, Object>> getProfile(String profileUrl) {
    List<String> rows =
        jdbcTemplate.query(
            "SELECT data_json FROM profiles WHERE profile_url = ?",
            (rs, rowNum) -> rs.getString("data_json"),
            profileUrl);

    if (rows.isEmpty()) {
      return Optional.empty();
    }

    return Optional.of(readJsonMap(rows.getFirst()));
  }

  public Map<String, Object> saveField(String profileUrl, String fieldName, String value) {
    Map<String, Object> profile = getOrCreateProfileData(profileUrl);
    profile.put(fieldName, value);
    profile.put(LAST_UPDATED_KEY, nowIso());
    upsertProfile(profileUrl, profile);
    return profile;
  }

  public Optional<Map<String, Object>> deleteField(String profileUrl, String fieldName) {
    Optional<Map<String, Object>> existing = getProfile(profileUrl);
    if (existing.isEmpty()) {
      return Optional.empty();
    }

    Map<String, Object> profile = existing.get();
    if (!profile.containsKey(fieldName)) {
      return Optional.empty();
    }

    profile.remove(fieldName);
    profile.put(LAST_UPDATED_KEY, nowIso());
    upsertProfile(profileUrl, profile);
    return Optional.of(profile);
  }

  public Map<String, Object> addExperience(String profileUrl, String value) {
    Map<String, Object> profile = getOrCreateProfileData(profileUrl);

    List<String> experiences = readExperienceList(profile.get(EXPERIENCE_KEY));
    experiences.add(value);
    profile.put(EXPERIENCE_KEY, experiences);
    profile.put(LAST_UPDATED_KEY, nowIso());

    upsertProfile(profileUrl, profile);
    return profile;
  }

  public Optional<Map<String, Object>> clearExperiences(String profileUrl) {
    Optional<Map<String, Object>> existing = getProfile(profileUrl);
    if (existing.isEmpty()) {
      return Optional.empty();
    }

    Map<String, Object> profile = existing.get();
    profile.put(EXPERIENCE_KEY, List.of());
    profile.put(LAST_UPDATED_KEY, nowIso());
    upsertProfile(profileUrl, profile);
    return Optional.of(profile);
  }

  public Optional<Map<String, Object>> deleteExperience(String profileUrl, int index) {
    Optional<Map<String, Object>> existing = getProfile(profileUrl);
    if (existing.isEmpty()) {
      return Optional.empty();
    }

    Map<String, Object> profile = existing.get();
    List<String> experiences = readExperienceList(profile.get(EXPERIENCE_KEY));

    if (index < 0 || index >= experiences.size()) {
      return Optional.empty();
    }

    experiences.remove(index);
    profile.put(EXPERIENCE_KEY, experiences);
    profile.put(LAST_UPDATED_KEY, nowIso());
    upsertProfile(profileUrl, profile);
    return Optional.of(profile);
  }

  public boolean deleteProfile(String profileUrl) {
    int deletedRows = jdbcTemplate.update("DELETE FROM profiles WHERE profile_url = ?", profileUrl);
    return deletedRows > 0;
  }

  private Map<String, Object> getOrCreateProfileData(String profileUrl) {
    return getProfile(profileUrl).orElseGet(HashMap::new);
  }

  private void upsertProfile(String profileUrl, Map<String, Object> profileData) {
    String dataJson = writeJson(profileData);
    String updatedAt = (String) profileData.getOrDefault(LAST_UPDATED_KEY, nowIso());

    jdbcTemplate.update(
        """
        INSERT INTO profiles (profile_url, data_json, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(profile_url) DO UPDATE SET
          data_json = excluded.data_json,
          updated_at = excluded.updated_at
        """,
        profileUrl,
        dataJson,
        updatedAt);
  }

  private String writeJson(Map<String, Object> value) {
    try {
      return objectMapper.writeValueAsString(value);
    } catch (Exception ex) {
      throw new IllegalStateException("Failed to serialize profile data", ex);
    }
  }

  private Map<String, Object> readJsonMap(String value) {
    try {
      return objectMapper.readValue(value, new TypeReference<>() {});
    } catch (Exception ex) {
      throw new IllegalStateException("Failed to deserialize profile data", ex);
    }
  }

  private List<String> readExperienceList(Object value) {
    List<String> response = new ArrayList<>();
    if (!(value instanceof List<?> rawList)) {
      return response;
    }

    for (Object item : rawList) {
      if (item != null) {
        response.add(String.valueOf(item));
      }
    }
    return response;
  }

  private String nowIso() {
    return DateTimeFormatter.ISO_INSTANT.format(Instant.now());
  }
}
