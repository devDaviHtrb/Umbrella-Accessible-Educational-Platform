package com.umbrella_api.common.config;

import com.umbrella_api.common.WebSocket.WebSocketAuthInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final WebSocketAuthInterceptor authInterceptor;

    public WebSocketConfig(WebSocketAuthInterceptor authInterceptor) {
        this.authInterceptor = authInterceptor;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Origens liberadas: dev web (5500), Expo (8081/19006) e o IP da LAN que
        // o app usa em dispositivo físico. O app mobile conecta por WebSocket
        // STOMP nativo (ws://.../ws/websocket), não SockJS.
        String[] origins = {
                "http://localhost:5500",
                "http://127.0.0.1:5500",
                "http://localhost:8081",
                "http://localhost:19006",
                "http://192.168.*:8081",
                "http://192.168.*:19006",
                "http://192.168.*:*",
                "*"
        };

        // Endpoint WebSocket STOMP NATIVO (sem SockJS). O app conecta com
        // WebSocket puro em `ws://host:8080/ws/websocket`, então registramos o
        // handshake nativo EXATAMENTE nesse path. (Um endpoint nativo em `/ws`
        // escutaria só em `/ws`; o sufixo `/websocket` é a convenção que o
        // cliente usa, por isso registramos o path completo.)
        registry
                .addEndpoint("/ws/websocket")
                .setAllowedOriginPatterns(origins);

        // Mantém também `/ws` nativo, por compatibilidade.
        registry
                .addEndpoint("/ws")
                .setAllowedOriginPatterns(origins);

        // Variante SockJS (fallback para clientes web que a utilizem).
        registry
                .addEndpoint("/ws-sockjs")
                .setAllowedOriginPatterns(origins)
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(authInterceptor);
    }
}
