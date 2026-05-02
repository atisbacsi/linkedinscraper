package com.linkedinscraper.backend.profile.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import java.net.URI;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.transaction.annotation.Transactional;
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

  @Transactional
  public UrlCleanupResult canonicalizeAndMergeProfileUrls() {
    List<Map<String, Object>> rows =
        jdbcTemplate.queryForList("SELECT profile_url, data_json FROM profiles ORDER BY profile_url");

    if (rows.isEmpty()) {
      return new UrlCleanupResult(0, 0, 0, 0);
    }

    int normalizedProfiles = 0;
    int mergedProfiles = 0;
    Map<String, Map<String, Object>> canonicalProfiles = new LinkedHashMap<>();

    for (Map<String, Object> row : rows) {
      String originalProfileUrl = (String) row.get("profile_url");
      String canonicalProfileUrl = canonicalizeProfileUrl(originalProfileUrl);
      if (!canonicalProfileUrl.equals(originalProfileUrl)) {
        normalizedProfiles++;
      }

      Map<String, Object> incomingData = readJsonMap((String) row.get("data_json"));
      Map<String, Object> existingData = canonicalProfiles.get(canonicalProfileUrl);
      if (existingData == null) {
        canonicalProfiles.put(canonicalProfileUrl, new HashMap<>(incomingData));
      } else {
        canonicalProfiles.put(canonicalProfileUrl, mergeProfileData(existingData, incomingData));
        mergedProfiles++;
      }
    }

    jdbcTemplate.update("DELETE FROM profiles");
    for (Map.Entry<String, Map<String, Object>> entry : canonicalProfiles.entrySet()) {
      Map<String, Object> mergedData = new HashMap<>(entry.getValue());
      mergedData.put(LAST_UPDATED_KEY, resolveLastUpdated(entry.getValue(), Collections.emptyMap()));
      upsertProfile(entry.getKey(), mergedData);
    }

    return new UrlCleanupResult(
        rows.size(),
        canonicalProfiles.size(),
        normalizedProfiles,
        mergedProfiles);
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

  private String canonicalizeProfileUrl(String profileUrl) {
    if (!(profileUrl.startsWith("http://") || profileUrl.startsWith("https://"))) {
      return profileUrl;
    }

    try {
      URI parsed = URI.create(profileUrl);
      URI withoutQueryAndFragment =
          new URI(parsed.getScheme(), parsed.getAuthority(), parsed.getPath(), null, null);
      return withoutQueryAndFragment.toString();
    } catch (RuntimeException | java.net.URISyntaxException ex) {
      int queryIndex = profileUrl.indexOf('?');
      int fragmentIndex = profileUrl.indexOf('#');
      int cutIndex = profileUrl.length();
      if (queryIndex >= 0) {
        cutIndex = Math.min(cutIndex, queryIndex);
      }
      if (fragmentIndex >= 0) {
        cutIndex = Math.min(cutIndex, fragmentIndex);
      }
      return profileUrl.substring(0, cutIndex);
    }
  }

  private Map<String, Object> mergeProfileData(
      Map<String, Object> existingData,
      Map<String, Object> incomingData) {
    Map<String, Object> mergedData = new HashMap<>(existingData);

    for (Map.Entry<String, Object> entry : incomingData.entrySet()) {
      String key = entry.getKey();
      Object incomingValue = entry.getValue();

      if (EXPERIENCE_KEY.equals(key)) {
        List<String> mergedExperiences =
            mergeExperiences(mergedData.get(EXPERIENCE_KEY), incomingValue);
        mergedData.put(EXPERIENCE_KEY, mergedExperiences);
        continue;
      }

      if (LAST_UPDATED_KEY.equals(key)) {
        mergedData.put(LAST_UPDATED_KEY, resolveLastUpdated(mergedData, incomingData));
        continue;
      }

      if (!mergedData.containsKey(key) || isBlankValue(mergedData.get(key))) {
        mergedData.put(key, incomingValue);
      }
    }

    mergedData.put(LAST_UPDATED_KEY, resolveLastUpdated(mergedData, incomingData));
    return mergedData;
  }

  private List<String> mergeExperiences(Object existingValue, Object incomingValue) {
    List<String> existingExperiences = readExperienceList(existingValue);
    List<String> incomingExperiences = readExperienceList(incomingValue);

    LinkedHashSet<String> merged = new LinkedHashSet<>();
    for (String experience : existingExperiences) {
      if (!experience.isBlank()) {
        merged.add(experience);
      }
    }
    for (String experience : incomingExperiences) {
      if (!experience.isBlank()) {
        merged.add(experience);
      }
    }
    return new ArrayList<>(merged);
  }

  private String resolveLastUpdated(Map<String, Object> primary, Map<String, Object> secondary) {
    String primaryValue = stringify(primary.get(LAST_UPDATED_KEY));
    String secondaryValue = stringify(secondary.get(LAST_UPDATED_KEY));

    Optional<Instant> primaryInstant = parseInstant(primaryValue);
    Optional<Instant> secondaryInstant = parseInstant(secondaryValue);

    if (primaryInstant.isPresent() && secondaryInstant.isPresent()) {
      return secondaryInstant.get().isAfter(primaryInstant.get()) ? secondaryValue : primaryValue;
    }
    if (primaryInstant.isPresent()) {
      return primaryValue;
    }
    if (secondaryInstant.isPresent()) {
      return secondaryValue;
    }

    if (!primaryValue.isBlank()) {
      return primaryValue;
    }
    if (!secondaryValue.isBlank()) {
      return secondaryValue;
    }
    return nowIso();
  }

  private Optional<Instant> parseInstant(String value) {
    if (value.isBlank()) {
      return Optional.empty();
    }
    try {
      return Optional.of(Instant.parse(value));
    } catch (Exception ex) {
      return Optional.empty();
    }
  }

  private String stringify(Object value) {
    return value == null ? "" : String.valueOf(value);
  }

  private boolean isBlankValue(Object value) {
    return stringify(value).isBlank();
  }

  public record UrlCleanupResult(
      int scannedProfiles,
      int canonicalProfiles,
      int normalizedProfiles,
      int mergedProfiles) {}
}
