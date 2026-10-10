package com.umbrella_api.modules.user.controller;

import com.umbrella_api.common.security.CustomUserDetails;
import com.umbrella_api.modules.user.dto.UserResponseDto;
import com.umbrella_api.modules.user.model.UserModel;
import com.umbrella_api.modules.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public/users")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /** Returns the profile of the currently authenticated user. */
    @GetMapping("/me")
    public ResponseEntity<UserResponseDto> getMe(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUserModel() == null) {
            return ResponseEntity.status(401).build();
        }
        UserModel user = userRepository.findById(userDetails.getUserModel().getId())
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        return ResponseEntity.ok(UserResponseDto.fromEntity(user));
    }

    /** Updates the neurodivergence description for the authenticated user. */
    @PatchMapping("/me/neurodivergence")
    @Transactional
    public ResponseEntity<UserResponseDto> updateNeurodivergence(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody String neurodivergence) {
        if (userDetails == null || userDetails.getUserModel() == null) {
            return ResponseEntity.status(401).build();
        }
        UserModel user = userRepository.findById(userDetails.getUserModel().getId())
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        user.setNeurodivergence(neurodivergence == null || neurodivergence.isBlank() ? null : neurodivergence.trim());
        userRepository.save(user);
        return ResponseEntity.ok(UserResponseDto.fromEntity(user));
    }
}
