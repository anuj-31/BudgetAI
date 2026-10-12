package in.anuj.moneymanager.controller;

import in.anuj.moneymanager.dto.AuthDTO;
import in.anuj.moneymanager.dto.ProfileDto;
import in.anuj.moneymanager.service.EmailDeliveryException;
import in.anuj.moneymanager.service.EmailNotVerifiedException;
import in.anuj.moneymanager.service.ProfileService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class ProfileController {
    private  final ProfileService profileService;
    private static final Path PROFILE_IMAGE_DIR = Paths.get("uploads", "profile-images");
    @PostMapping("/register")
    public ResponseEntity<?> registerProfile(@RequestBody ProfileDto profileDto){
        try {
            ProfileDto registeredProfile = profileService.registerProfile(profileDto);
            return ResponseEntity.status(HttpStatus.CREATED).body(registeredProfile);
        } catch (EmailDeliveryException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                    "message", "Your profile was created, but we couldn't send the activation email. " +
                            "Use Resend activation email to try again."
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
        }
    }
    @PostMapping("/resend-activation")
    public ResponseEntity<Map<String, String>> resendActivationEmail(@RequestBody Map<String, String> request) {
        try {
            boolean sent = profileService.resendActivationEmail(request.get("email"));
            if (sent) {
                return ResponseEntity.ok(Map.of("message", "Activation email sent. Please check your inbox."));
            }
            return ResponseEntity.accepted().body(Map.of(
                    "message", "No activation email was sent. Check the email address or contact support."
            ));
        } catch (EmailDeliveryException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                    "message", "We couldn't send the activation email. Please try again later or contact support."
            ));
        }
    }
    @GetMapping("/activate")
    public ResponseEntity<String> activateProfile(@RequestParam String token){
        boolean isActivvated = profileService.activateProfile(token);
        if(isActivvated){
            return ResponseEntity.ok("Your BudgetAI account is now active. You can log in.");
        }else{
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("This activation link is invalid or has already been used.");
        }
    }
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody AuthDTO authDTO) {
        try {
            Map<String, Object> response = profileService.authenticateAndGenerateToken(authDTO);

            return ResponseEntity.ok(response);
        } catch (EmailNotVerifiedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<ProfileDto> getProfile() {
        return ResponseEntity.ok(profileService.getPublicProfile(null));
    }

    @PutMapping("/profile/image")
    public ResponseEntity<ProfileDto> updateProfileImage(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(profileService.updateProfileImage(body.get("profileImageUrl")));
    }

    @PostMapping(value = "/profile/image/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ProfileDto> uploadProfileImage(@RequestParam("file") MultipartFile file,
                                                         HttpServletRequest request) throws IOException {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        Files.createDirectories(PROFILE_IMAGE_DIR);
        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "";
        String extension = "";
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex >= 0) {
            extension = originalFilename.substring(dotIndex);
        }

        String filename = UUID.randomUUID() + extension;
        Path destination = PROFILE_IMAGE_DIR.resolve(filename).normalize();
        file.transferTo(destination);

        String baseUrl = request.getRequestURL().toString().replace(request.getRequestURI(), request.getContextPath());
        String imageUrl = baseUrl + "/profile/image/file/" + filename;
        return ResponseEntity.ok(profileService.updateProfileImage(imageUrl));
    }

    @GetMapping("/profile/image/file/{filename}")
    public ResponseEntity<Resource> getProfileImage(@PathVariable String filename) throws MalformedURLException {
        Path filePath = PROFILE_IMAGE_DIR.resolve(filename).normalize();
        Resource resource = new UrlResource(filePath.toUri());
        if (!resource.exists() || !resource.isReadable()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }

    @GetMapping("/test")
    public String test(){
        return "Test successful";
    }

}
