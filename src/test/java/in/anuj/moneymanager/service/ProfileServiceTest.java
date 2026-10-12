package in.anuj.moneymanager.service;

import in.anuj.moneymanager.dto.AuthDTO;
import in.anuj.moneymanager.dto.ProfileDto;
import in.anuj.moneymanager.entity.ProfileEntity;
import in.anuj.moneymanager.repository.ProfileRepository;
import in.anuj.moneymanager.util.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProfileServiceTest {
    @Mock
    private ProfileRepository profileRepository;
    @Mock
    private EmailService emailService;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private JwtUtil jwtUtil;
    @InjectMocks
    private ProfileService profileService;

    @BeforeEach
    void setActivationUrl() {
        ReflectionTestUtils.setField(profileService, "activationURL", "https://api.example.test/");
    }

    @Test
    void registrationSavesInactiveProfileAndSendsActivationLink() {
        when(profileRepository.existsByEmail("person@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password")).thenReturn("encoded-password");
        when(profileRepository.save(any(ProfileEntity.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ProfileDto registered = profileService.registerProfile(ProfileDto.builder()
                .fullName("Person")
                .email(" Person@Example.com ")
                .password("password")
                .build());

        ArgumentCaptor<ProfileEntity> profileCaptor = ArgumentCaptor.forClass(ProfileEntity.class);
        verify(profileRepository).save(profileCaptor.capture());
        ProfileEntity savedProfile = profileCaptor.getValue();
        assertEquals("person@example.com", savedProfile.getEmail());
        assertEquals(Boolean.FALSE, savedProfile.getIsActive());
        assertNotNull(savedProfile.getActivationToken());
        assertNotEquals("", savedProfile.getActivationToken());
        assertEquals("person@example.com", registered.getEmail());
        verify(emailService).sendActivationEmail(
                eq("person@example.com"),
                eq("Activate your BudgetAI account"),
                eq("https://api.example.test/api/v1.0/activate?token=" + savedProfile.getActivationToken())
        );
    }

    @Test
    void registrationKeepsSavedInactiveProfileWhenEmailProviderFails() {
        when(profileRepository.existsByEmail("person@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password")).thenReturn("encoded-password");
        when(profileRepository.save(any(ProfileEntity.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        doThrow(new EmailDeliveryException("provider unavailable"))
                .when(emailService).sendActivationEmail(any(), any(), any());

        assertThrows(EmailDeliveryException.class, () -> profileService.registerProfile(ProfileDto.builder()
                .fullName("Person")
                .email("person@example.com")
                .password("password")
                .build()));

        ArgumentCaptor<ProfileEntity> profileCaptor = ArgumentCaptor.forClass(ProfileEntity.class);
        verify(profileRepository).save(profileCaptor.capture());
        assertEquals(Boolean.FALSE, profileCaptor.getValue().getIsActive());
        assertNotNull(profileCaptor.getValue().getActivationToken());
    }

    @Test
    void duplicateRegistrationIsRejectedWithoutEmail() {
        when(profileRepository.existsByEmail("person@example.com")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> profileService.registerProfile(
                ProfileDto.builder().email(" Person@Example.com ").build()
        ));

        verify(profileRepository, never()).save(any());
        verifyNoInteractions(emailService);
    }

    @Test
    void resendActivationUsesExistingTokenWithoutCreatingAnotherProfile() {
        ProfileEntity profile = ProfileEntity.builder()
                .email("person@example.com")
                .isActive(false)
                .activationToken("existing-token")
                .build();
        when(profileRepository.findFirstByEmailOrderByIdDesc("person@example.com"))
                .thenReturn(Optional.of(profile));

        assertTrue(profileService.resendActivationEmail(" Person@Example.com "));

        verify(profileRepository, never()).save(any());
        verify(emailService).sendActivationEmail(
                eq("person@example.com"),
                eq("Activate your BudgetAI account"),
                eq("https://api.example.test/api/v1.0/activate?token=existing-token")
        );
    }

    @Test
    void activationClearsTokenAndCannotBeReused() {
        ProfileEntity profile = ProfileEntity.builder()
                .email("person@example.com")
                .isActive(false)
                .activationToken("valid-token")
                .build();
        when(profileRepository.findByActivationToken("valid-token"))
                .thenReturn(Optional.of(profile), Optional.empty());
        when(profileRepository.findByActivationToken("invalid-token")).thenReturn(Optional.empty());

        assertTrue(profileService.activateProfile("valid-token"));
        assertEquals(Boolean.TRUE, profile.getIsActive());
        assertNull(profile.getActivationToken());
        assertFalse(profileService.activateProfile("valid-token"));
        assertFalse(profileService.activateProfile("invalid-token"));
        assertFalse(profileService.activateProfile(""));
        verify(profileRepository).save(profile);
    }

    @Test
    void activeAccountGetsTokenOnlyAfterSuccessfulAuthentication() {
        ProfileEntity profile = ProfileEntity.builder()
                .email("person@example.com")
                .isActive(true)
                .build();
        when(profileRepository.findFirstByEmailOrderByIdDesc("person@example.com"))
                .thenReturn(Optional.of(profile), Optional.of(profile), Optional.of(profile));
        when(authenticationManager.authenticate(any(Authentication.class)))
                .thenReturn(new UsernamePasswordAuthenticationToken("person@example.com", null, List.of()));
        when(jwtUtil.generateToken("person@example.com")).thenReturn("jwt-token");

        var response = profileService.authenticateAndGenerateToken(
                AuthDTO.builder().email(" Person@Example.com ").password("password").build()
        );

        assertEquals("jwt-token", response.get("token"));
        verify(authenticationManager).authenticate(any(Authentication.class));
        verify(jwtUtil).generateToken("person@example.com");
    }

    @Test
    void inactiveAccountCannotAuthenticateOrReceiveToken() {
        ProfileEntity profile = ProfileEntity.builder()
                .email("person@example.com")
                .isActive(false)
                .build();
        when(profileRepository.findFirstByEmailOrderByIdDesc("person@example.com"))
                .thenReturn(Optional.of(profile));

        assertThrows(EmailNotVerifiedException.class, () ->
                profileService.authenticateAndGenerateToken(
                        AuthDTO.builder().email(" Person@Example.com ").password("password").build()
                )
        );

        verifyNoInteractions(authenticationManager, jwtUtil);
    }

    @Test
    void badCredentialsDoNotGenerateToken() {
        ProfileEntity profile = ProfileEntity.builder()
                .email("person@example.com")
                .isActive(true)
                .build();
        when(profileRepository.findFirstByEmailOrderByIdDesc("person@example.com"))
                .thenReturn(Optional.of(profile));
        when(authenticationManager.authenticate(any(Authentication.class)))
                .thenThrow(new BadCredentialsException("bad credentials"));

        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                profileService.authenticateAndGenerateToken(
                        AuthDTO.builder().email("person@example.com").password("wrong").build()
                )
        );

        assertEquals("Invalid email or password", exception.getMessage());
        verifyNoInteractions(jwtUtil);
    }

}
