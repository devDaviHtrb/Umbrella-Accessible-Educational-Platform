package com.umbrella_api.common.security;

import com.umbrella_api.modules.user.model.UserModel;

public interface JwtService {

    String generateToken(UserModel user);

    String extractUsername(String token);

    boolean isTokenValid(String token);
}