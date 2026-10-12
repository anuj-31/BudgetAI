package in.anuj.moneymanager.service;

import in.anuj.moneymanager.dto.AuthDTO;
import in.anuj.moneymanager.dto.ProfileDto;
import in.anuj.moneymanager.entity.ProfileEntity;
import in.anuj.moneymanager.repository.ProfileRepository;
import in.anuj.moneymanager.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProfileService {
    private final ProfileRepository profileRepository;
    private final  EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    @Value("${app.activation.url}")
    private   String activationURL;

    public ProfileDto registerProfile(ProfileDto profileDTO) {
        String normalizedEmail = normalizeEmail(profileDTO.getEmail());
        profileDTO.setEmail(normalizedEmail);

        if (profileRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("Email is already registered");
        }

        ProfileEntity newProfile = toEntity(profileDTO);
        newProfile.setIsActive(false);
        newProfile.setActivationToken(UUID.randomUUID().toString());
        newProfile = profileRepository.save(newProfile);
        sendActivationEmail(newProfile);
        return toDTO(newProfile);
    }

    public boolean resendActivationEmail(String email) {
        ProfileEntity profile = profileRepository.findFirstByEmailOrderByIdDesc(normalizeEmail(email))
                .orElse(null);
        if (profile == null || Boolean.TRUE.equals(profile.getIsActive())) {
            return false;
        }

        if (profile.getActivationToken() == null || profile.getActivationToken().isBlank()) {
            profile.setActivationToken(UUID.randomUUID().toString());
            profile = profileRepository.save(profile);
        }
        sendActivationEmail(profile);
        return true;
    }

    private void sendActivationEmail(ProfileEntity profile) {
        String activationLink = activationURL.replaceAll("/+$", "")
                + "/api/v1.0/activate?token=" + profile.getActivationToken();
        emailService.sendActivationEmail(
                profile.getEmail(),
                "Activate your BudgetAI account",
                activationLink
        );
    }

    public ProfileEntity toEntity(ProfileDto profileDTO) {
        return ProfileEntity.builder()
                .id(profileDTO.getId())
                .fullName(profileDTO.getFullName())
                .email(profileDTO.getEmail())
                .password(passwordEncoder.encode(profileDTO.getPassword()))
                .profileImageUrl(profileDTO.getProfileImageUrl())
                .createdAt(profileDTO.getCreatedAt())
                .updatedAt(profileDTO.getUpdatedAt())
                .build();
    }
    public ProfileDto toDTO(ProfileEntity profileEntity) {
        return ProfileDto.builder()
                .id(profileEntity.getId())
                .fullName(profileEntity.getFullName())
                .email(profileEntity.getEmail())
//                .password(profileEntity.getPassword())
                .profileImageUrl(profileEntity.getProfileImageUrl())
                .createdAt(profileEntity.getCreatedAt())
                .updatedAt(profileEntity.getUpdatedAt())
                .build();
    }
    public boolean activateProfile(String activationToken) {
        if (activationToken == null || activationToken.isBlank()) {
            return false;
        }
        return profileRepository.findByActivationToken(activationToken)
                .map(profile -> {
                    profile.setIsActive(true);
                    profile.setActivationToken(null);
                    profileRepository.save(profile);
                    return true;
                })
                .orElse(false);
    }
    //
    public boolean isAccountActive(String email) {
        return profileRepository.findFirstByEmailOrderByIdDesc(normalizeEmail(email))
                .map(ProfileEntity::getIsActive)
                .orElse(false);
    }

    public ProfileEntity getCurrentProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return profileRepository.findFirstByEmailOrderByIdDesc(normalizeEmail(authentication.getName()))
                .orElseThrow(() -> new UsernameNotFoundException("Profile not found with email: " + authentication.getName()));
    }
    //
    public ProfileDto getPublicProfile(String email) {
        ProfileEntity currentUser = null;
        if (email == null) {
            currentUser = getCurrentProfile();
        }else {
            currentUser = profileRepository.findFirstByEmailOrderByIdDesc(normalizeEmail(email))
                    .orElseThrow(() -> new UsernameNotFoundException("Profile not found with email: " + email));
        }

        return ProfileDto.builder()
                .id(currentUser.getId())
                .fullName(currentUser.getFullName())
                .email(currentUser.getEmail())
                .profileImageUrl(currentUser.getProfileImageUrl())
                .createdAt(currentUser.getCreatedAt())
                .updatedAt(currentUser.getUpdatedAt())
                .build();
    }

    public ProfileDto updateProfileImage(String profileImageUrl) {
        ProfileEntity currentUser = getCurrentProfile();
        currentUser.setProfileImageUrl(profileImageUrl);
        return toDTO(profileRepository.save(currentUser));
    }



    public Map<String, Object> authenticateAndGenerateToken(AuthDTO authDTO) {
        String normalizedEmail = normalizeEmail(authDTO.getEmail());
        ProfileEntity profile = profileRepository.findFirstByEmailOrderByIdDesc(normalizedEmail)
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!Boolean.TRUE.equals(profile.getIsActive())) {
            throw new EmailNotVerifiedException();
        }

        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(normalizedEmail, authDTO.getPassword()));
        } catch (DisabledException e) {
            throw new EmailNotVerifiedException();
        } catch (AuthenticationException e) {
            throw new RuntimeException("Invalid email or password");
        }

        if (!isAccountActive(normalizedEmail)) {
            throw new EmailNotVerifiedException();
        }

        ProfileDto user = getPublicProfile(normalizedEmail);
        String token = jwtUtil.generateToken(normalizedEmail);
        return Map.of("token", token, "user", user);
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
