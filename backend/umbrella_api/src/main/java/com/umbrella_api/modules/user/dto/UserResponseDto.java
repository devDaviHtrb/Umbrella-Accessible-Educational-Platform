package com.umbrella_api.modules.user.dto;

import com.umbrella_api.modules.user.model.UserModel;

public record UserResponseDto(
        Long id,
        String name,
        String email) {

    public static UserResponseDto fromEntity(UserModel user) {
        if (user == null)
            return null;

        return new UserResponseDto(
                user.getId(),
                user.getName(),
                user.getEmail());
    }
}