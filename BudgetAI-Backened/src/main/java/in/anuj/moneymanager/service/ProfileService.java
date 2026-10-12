package in.anuj.moneymanager.service;

import in.anuj.moneymanager.dto.AuthDTO;
import in.anuj.moneymanager.dto.ProfileDto;
import in.anuj.moneymanager.entity.ProfileEntity;
import in.anuj.moneymanager.repository.ProfileRepository;
import in.anuj.moneymanager.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
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
            throw new RuntimeException("Email is already registered");
        }

        ProfileEntity newProfile = toEntity(profileDTO);
        newProfile.setIsActive(true);
        newProfile.setActivationToken(UUID.randomUUID().toString());
        newProfile = profileRepository.save(newProfile);
        //send activation email
        String activationLink = activationURL+"/api/v1.0/activate?token=" + newProfile.getActivationToken();
        String subject = "Activate your Money Manager account";
        String body = "Click on the following link to activate your account: " + activationLink;
        emailService.sendEmail(newProfile.getEmail(), subject, body);
        return toDTO(newProfile);
//        return  profileDTO;
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
        return profileRepository.findByActivationToken(activationToken)
                .map(profile -> {
                    profile.setIsActive(true);
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
        try {
            String normalizedEmail = normalizeEmail(authDTO.getEmail());
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(normalizedEmail, authDTO.getPassword()));
            //Generate JWT token
            String token = jwtUtil.generateToken(normalizedEmail);
            return Map.of(
                    "token", token,
                    "user", getPublicProfile(normalizedEmail)
            );
        } catch (Exception e) {
            throw new RuntimeException("Invalid email or password");
        }
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
