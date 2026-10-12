package in.anuj.moneymanager.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class EmailServiceTest {
    private EmailService emailService;
    private RestTemplate restTemplate;

    @BeforeEach
    void setUp() {
        emailService = new EmailService();
        restTemplate = mock(RestTemplate.class);
        ReflectionTestUtils.setField(emailService, "restTemplate", restTemplate);
        ReflectionTestUtils.setField(emailService, "apiKey", "test-api-key");
        ReflectionTestUtils.setField(emailService, "fromEmail", "sender@example.com");
        ReflectionTestUtils.setField(emailService, "senderName", "BudgetAI");
    }

    @Test
    void activationEmailContainsClickableActivationLinkAndBrevoAuthentication() {
        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.accepted().build());

        emailService.sendActivationEmail(
                "person@example.com",
                "Activate your BudgetAI account",
                "https://api.example.test/api/v1.0/activate?token=test-token"
        );

        var requestCaptor = org.mockito.ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).postForEntity(
                eq("https://api.brevo.com/v3/smtp/email"),
                requestCaptor.capture(),
                eq(String.class)
        );
        HttpEntity<?> request = requestCaptor.getValue();
        assertEquals("test-api-key", request.getHeaders().getFirst("api-key"));
        @SuppressWarnings("unchecked")
        Map<String, Object> payload = (Map<String, Object>) request.getBody();
        assertEquals("Activate your BudgetAI account", payload.get("subject"));
        assertTrue(payload.get("htmlContent").toString().contains(
                "<a href=\"https://api.example.test/api/v1.0/activate?token=test-token\">"
        ));
    }

    @Test
    void missingBrevoConfigurationFailsExplicitly() {
        ReflectionTestUtils.setField(emailService, "apiKey", "");

        EmailDeliveryException exception = assertThrows(
                EmailDeliveryException.class,
                () -> emailService.sendEmail("person@example.com", "subject", "body")
        );

        assertTrue(exception.getMessage().contains("not configured"));
        verifyNoInteractions(restTemplate);
    }

    @Test
    void providerConnectionFailureIsLoggedAndPropagated() {
        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(String.class)))
                .thenThrow(new ResourceAccessException("connection timed out"));

        EmailDeliveryException exception = assertThrows(
                EmailDeliveryException.class,
                () -> emailService.sendActivationEmail(
                        "person@example.com",
                        "Activate your BudgetAI account",
                        "https://api.example.test/activate?token=test-token"
                )
        );

        assertTrue(exception.getMessage().contains("Unable to send"));
        assertInstanceOf(ResourceAccessException.class, exception.getCause());
    }

    @Test
    void providerUnauthorizedResponseIsLoggedAndPropagatedWithoutExposingCredentials() {
        HttpClientErrorException unauthorized = HttpClientErrorException.create(
                org.springframework.http.HttpStatus.UNAUTHORIZED,
                "Unauthorized",
                org.springframework.http.HttpHeaders.EMPTY,
                new byte[0],
                null
        );
        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(String.class)))
                .thenThrow(unauthorized);

        EmailDeliveryException exception = assertThrows(
                EmailDeliveryException.class,
                () -> emailService.sendActivationEmail(
                        "person@example.com",
                        "Activate your BudgetAI account",
                        "https://api.example.test/activate?token=test-token"
                )
        );

        assertEquals("The email provider rejected the request. Please contact support.", exception.getMessage());
        assertSame(unauthorized, exception.getCause());
        assertFalse(exception.getMessage().contains("test-api-key"));
    }
}
