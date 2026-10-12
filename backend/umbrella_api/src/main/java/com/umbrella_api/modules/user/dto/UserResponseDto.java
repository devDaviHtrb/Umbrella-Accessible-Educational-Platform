package com.umbrella_api.modules.user.dto;

import com.umbrella_api.modules.user.model.UserModel;

public record UserResponseDto(
        Long id,
        String name,
        String email,
        String neurodivergence,
        String avatarUrl) {

    public static UserResponseDto fromEntity(UserModel user) {
        return fromEntity(user, null);
    }

    public static UserResponseDto fromEntity(UserModel user, String avatarUrl) {
        if (user == null)
            return null;

        return new UserResponseDto(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getNeurodivergence(),
                avatarUrl);
    }
}