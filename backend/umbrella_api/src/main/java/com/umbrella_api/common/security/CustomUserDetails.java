package com.umbrella_api.common.security;

import com.umbrella_api.modules.user.model.UserModel;
import lombok.Getter;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;

@Getter
public class CustomUserDetails extends User {
    // Guarda o seu modelo do banco completo na memória da requisição!
    private final UserModel userModel;

    public CustomUserDetails(UserModel userModel) {
        super(
                userModel.getEmail(),
                userModel.getPassword(),
                userModel.getRoles().stream()
                        .map(Enum::name)
                        .map(SimpleGrantedAuthority::new)
                        .toList());
        this.userModel = userModel;
    }
}