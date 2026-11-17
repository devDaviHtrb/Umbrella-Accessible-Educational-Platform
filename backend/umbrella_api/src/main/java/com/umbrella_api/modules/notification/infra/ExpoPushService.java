package com.umbrella_api.modules.notification.infra;

import java.util.List;
import java.util.Map;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.umbrella_api.modules.notification.model.DeviceToken;
import com.umbrella_api.modules.notification.repository.DeviceTokenRepository;

/**
 * Envia notificações push para o celular via o serviço Expo Push
 * (https://exp.host/--/api/v2/push/send). Para cada usuário, busca seus
 * tokens de dispositivo e dispara o push de forma assíncrona (nunca bloqueia
 * nem derruba a operação que gerou a notificação).
 */
@Service
public class ExpoPushService {

    private final DeviceTokenRepository deviceTokenRepository;
    private final WebClient webClient;

    public ExpoPushService(DeviceTokenRepository deviceTokenRepository) {
        this.deviceTokenRepository = deviceTokenRepository;
        this.webClient = WebClient.builder()
                .baseUrl("https://exp.host")
                .build();
    }

    /** Envia um push para todos os dispositivos do usuário (assíncrono). */
    @Async
    public void sendToUser(Long userId, String title, String body, Map<String, Object> data) {
        List<DeviceToken> tokens = deviceTokenRepository.findByUserId(userId);
        for (DeviceToken device : tokens) {
            String to = device.getToken();
            if (to == null || to.isBlank()) {
                continue;
            }
            Map<String, Object> payload = Map.of(
                    "to", to,
                    "title", title != null ? title : "Umbrella",
                    "body", body != null ? body : "",
                    "sound", "default",
                    "data", data != null ? data : Map.of());
            try {
                webClient.post()
                        .uri("/--/api/v2/push/send")
                        .header("Content-Type", "application/json")
                        .bodyValue(payload)
                        .retrieve()
                        .toBodilessEntity()
                        .block();
            } catch (Exception e) {
                // Token inválido/expirado ou falha de rede: ignora (push é
                // best-effort; a notificação persistida continua valendo).
                System.err.println("[ExpoPush] falha ao enviar para " + to + ": " + e.getMessage());
            }
        }
    }
}
