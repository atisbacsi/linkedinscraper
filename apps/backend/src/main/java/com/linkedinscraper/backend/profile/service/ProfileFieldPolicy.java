package com.linkedinscraper.backend.profile.service;

import java.util.Set;

public final class ProfileFieldPolicy {

  public static final Set<String> ALLOWED_SCALAR_FIELDS =
      Set.of("Name", "Headline", "Info", "Location", "Contact", "NumOfContacts");

  private ProfileFieldPolicy() {}

  public static boolean isAllowedScalarField(String fieldName) {
    return ALLOWED_SCALAR_FIELDS.contains(fieldName);
  }
}
