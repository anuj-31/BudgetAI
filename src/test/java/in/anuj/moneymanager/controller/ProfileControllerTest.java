package in.anuj.moneymanager.controller;

import in.anuj.moneymanager.dto.AuthDTO;
import in.anuj.moneymanager.dto.ProfileDto;
import in.anuj.moneymanager.service.EmailDeliveryException;
import in.anuj.moneymanager.service.EmailNotVerifiedException;
import in.anuj.moneymanager.service.ProfileService;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ProfileControllerTest {
    private final ProfileService profileService = mock(ProfileService.class);
    private final ProfileController controller = new ProfileController(profileService);

    @Test
    void registrationReturnsServiceUnavailableWhenActivationEmailFails() {
        when(profileService.registerProfile(org.mockito.ArgumentMatchers.any(ProfileDto.class)))
                .thenThrow(new EmailDeliveryException("provider unavailable"));

        var response = controller.registerProfile(ProfileDto.builder().email("person@example.com").build());

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, response.getStatusCode());
        assertEquals(
                "Your profile was created, but we couldn't send the activation email. Use Resend activation email to try again.",
                ((Map<?, ?>) response.getBody()).get("message")
        );
    }

    @Test
    void invalidActivationTokenReturnsNotFound() {
        when(profileService.activateProfile("invalid-token")).thenReturn(false);

        var response = controller.activateProfile("invalid-token");

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals("This activation link is invalid or has already been used.", response.getBody());
    }

    @Test
    void unverifiedLoginReturnsForbiddenActivationMessage() {
        when(profileService.authenticateAndGenerateToken(org.mockito.ArgumentMatchers.any(AuthDTO.class)))
                .thenThrow(new EmailNotVerifiedException());

        var response = controller.login(AuthDTO.builder().email("person@example.com").build());

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertEquals(
                EmailNotVerifiedException.MESSAGE,
                response.getBody().get("message")
        );
    }
}
