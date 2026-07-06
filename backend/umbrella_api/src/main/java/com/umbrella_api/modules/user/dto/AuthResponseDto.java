package com.umbrella_api.modules.user.dto;

import java.util.Set;

public record AuthResponseDto(
        String accessToken,
        String tokenType,
        String userId,
        String name,
        String email,
        Set<String> roles
) {}
