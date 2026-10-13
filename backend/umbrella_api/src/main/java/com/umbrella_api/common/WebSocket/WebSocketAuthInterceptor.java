package com.umbrella_api.common.WebSocket;

import com.umbrella_api.common.security.CustomUserDetails;
import com.umbrella_api.common.security.CustomUserDetailsService;
import com.umbrella_api.common.security.JwtService;

import java.util.List;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

@Component
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    public WebSocketAuthInterceptor(
            JwtService jwtService,
            CustomUserDetailsService userDetailsService
    ) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(
                        message,
                        StompHeaderAccessor.class
                );

        if (accessor == null || accessor.getCommand() != StompCommand.CONNECT) {
            return message;
        }

        List<String> authorizationHeaders =
                accessor.getNativeHeader("Authorization");

        if (authorizationHeaders == null || authorizationHeaders.isEmpty()) {
            throw new IllegalArgumentException(
                    "Cabeçalho Authorization não informado"
            );
        }

        String authorization = authorizationHeaders.get(0);

        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new IllegalArgumentException(
                    "Token Bearer inválido ou ausente"
            );
        }

        String token = authorization.substring(7);

        // Ajuste estes métodos para os nomes existentes no seu JwtService.
        String username = jwtService.extractUsername(token);

        if (username == null || !jwtService.isTokenValid(token)) {
            throw new IllegalArgumentException("Token JWT inválido");
        }

        UserDetails userDetails =
                userDetailsService.loadUserByUsername(username);

        if (!(userDetails instanceof CustomUserDetails customUserDetails)) {
            throw new IllegalStateException(
                    "O UserDetails carregado não é CustomUserDetails"
            );
        }

        String userId = customUserDetails
                .getUserModel()
                .getId()
                .toString();

        var authorities = userDetails.getAuthorities();

        // O nome do principal passa a ser o ID, usado também no envio.
        var authentication =
                new UsernamePasswordAuthenticationToken(
                        userId,
                        null,
                        authorities
                );

        accessor.setUser(authentication);

        return message;
    }
}
