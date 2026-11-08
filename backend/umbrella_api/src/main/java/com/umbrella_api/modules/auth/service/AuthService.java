package com.umbrella_api.modules.auth.service;

import com.umbrella_api.modules.user.dto.AuthResponseDto;
import com.umbrella_api.modules.user.dto.LoginRequestDto;
import com.umbrella_api.modules.user.dto.RegisterRequestDto;

public interface AuthService {

    AuthResponseDto login(
            LoginRequestDto request
    );

    AuthResponseDto register(
            RegisterRequestDto request
    );
}