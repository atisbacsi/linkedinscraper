package com.linkedinscraper.backend.profile.api;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.lang.reflect.Method;
import org.junit.jupiter.api.Test;

class ProfileControllerTest {

  @Test
  void normalizeProfileUrl_stripsQueryParametersFromLinkedInUrl() throws Exception {
    ProfileController controller = new ProfileController(null);
    Method normalizeProfileUrl =
        ProfileController.class.getDeclaredMethod("normalizeProfileUrl", String.class);
    normalizeProfileUrl.setAccessible(true);

    String inputUrl = "https://www.linkedin.com/in/techworldofflorian/?locale=de";
    String normalized = (String) normalizeProfileUrl.invoke(controller, inputUrl);

    assertEquals("https://www.linkedin.com/in/techworldofflorian/", normalized);
  }
}
