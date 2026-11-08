package com.umbrella_api.modules.auth.controller;

import com.umbrella_api.modules.auth.service.AuthService;
import com.umbrella_api.modules.user.dto.AuthResponseDto;
import com.umbrella_api.modules.user.dto.LoginRequestDto;
import com.umbrella_api.modules.user.dto.RegisterRequestDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService service;

    @GetMapping("/test")
    public String test() {
        return "running";
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponseDto> register(
            @RequestBody @Valid RegisterRequestDto request) {

        return ResponseEntity.ok(
                service.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDto> login(
            @RequestBody @Valid LoginRequestDto request) {

        return ResponseEntity.ok(
                service.login(request));
    }
}
