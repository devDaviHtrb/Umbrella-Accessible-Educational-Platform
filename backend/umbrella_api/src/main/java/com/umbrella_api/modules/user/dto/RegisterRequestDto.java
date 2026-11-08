package com.umbrella_api.modules.user.dto;

import com.umbrella_api.modules.user.model.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record RegisterRequestDto(

                @NotBlank String name,

                @Email String email,

                @NotBlank String password,

                String neurodivergence,

                UserRole role

) {
}