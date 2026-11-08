package com.umbrella_api.modules.auth.service;

import com.umbrella_api.common.security.JwtService;
import com.umbrella_api.modules.user.dto.AuthResponseDto;
import com.umbrella_api.modules.user.dto.LoginRequestDto;
import com.umbrella_api.modules.user.dto.RegisterRequestDto;
import com.umbrella_api.modules.user.model.UserModel;
import com.umbrella_api.modules.user.model.UserRole;
import com.umbrella_api.modules.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthServiceImpl
        implements AuthService {

    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @Override
    public AuthResponseDto login(
            LoginRequestDto request
    ) {

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.email(),
                        request.password()
                )
        );

        UserModel user = repository
                .findByEmail(request.email())
                .orElseThrow();

        String token =
                jwtService.generateToken(user);

        return buildResponse(
                user,
                token
        );
    }

    @Override
    public AuthResponseDto register(
            RegisterRequestDto request
    ) {


        UserRole requestedRole = request.role() != null ? request.role() : UserRole.ROLE_USER;

        UserModel user = UserModel.builder()
                .name(request.name())
                .email(request.email())
                .password(
                        passwordEncoder.encode(
                                request.password()
                        )
                )
                .roles(Set.of(requestedRole))
                .build();

        repository.save(user);

        String token =
                jwtService.generateToken(user);

        return buildResponse(
                user,
                token
        );
    }

    private AuthResponseDto buildResponse(
            UserModel user,
            String token
    ) {

        return new AuthResponseDto(
                token,
                "Bearer",
                user.getId().toString(),
                user.getName(),
                user.getEmail(),
                user.getRoles()
                        .stream()
                        .map(Enum::name)
                        .collect(Collectors.toSet())
        );
    }
}
