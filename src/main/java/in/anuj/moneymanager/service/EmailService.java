package in.anuj.moneymanager.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClientException;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.HtmlUtils;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    @Value("${brevo.api.key}")
    private String apiKey;

    @Value("${brevo.sender.email}")
    private String fromEmail;

    @Value("${brevo.sender.name}")
    private String senderName;

    private RestTemplate restTemplate = createRestTemplate();

    public void sendEmail(String to, String subject, String body) {
        send(to, subject, body);
    }

    public void sendActivationEmail(String to, String subject, String activationLink) {
        String escapedLink = HtmlUtils.htmlEscape(activationLink);
        String body = "<p>Click on the following link to activate your account: "
                + "<a href=\"" + escapedLink + "\">" + escapedLink + "</a></p>";
        send(to, subject, body);
    }

    private void send(String to, String subject, String body) {
        if (apiKey == null || apiKey.isBlank() || fromEmail == null || fromEmail.isBlank()) {
            log.error("Brevo email delivery is unavailable because its API key or sender address is not configured.");
            throw new EmailDeliveryException("Email delivery is not configured. Please contact support.");
        }

        Map<String, Object> payload = Map.of(
                "sender", Map.of(
                        "email", fromEmail,
                        "name", senderName
                ),
                "to", List.of(
                        Map.of("email", to)
                ),
                "subject", subject,
                "htmlContent", body
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("api-key", apiKey);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

        try {
            restTemplate.postForEntity(
                    "https://api.brevo.com/v3/smtp/email",
                    request,
                    String.class
            );
        } catch (HttpStatusCodeException e) {
            log.error("Brevo rejected the email request with HTTP {}. Verify the API key and sender configuration.",
                    e.getStatusCode().value(), e);
            throw new EmailDeliveryException(
                    "The email provider rejected the request. Please contact support.",
                    e
            );
        } catch (RestClientException e) {
            log.error("Brevo email request failed for subject '{}'.", subject, e);
            throw new EmailDeliveryException("Unable to send the activation email. Please try again later.", e);
        }
    }

    private static RestTemplate createRestTemplate() {
        org.springframework.http.client.SimpleClientHttpRequestFactory requestFactory =
                new org.springframework.http.client.SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(java.time.Duration.ofSeconds(5));
        requestFactory.setReadTimeout(java.time.Duration.ofSeconds(10));
        return new RestTemplate(requestFactory);
    }
}