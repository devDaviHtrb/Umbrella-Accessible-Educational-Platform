package com.umbrella_api.modules.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequestDto(

        @Email
        String email,

        @NotBlank
        String password

) {}