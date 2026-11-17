package com.umbrella_api.modules.notification.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.umbrella_api.common.dto.GenericResponse;
import com.umbrella_api.common.security.CustomUserDetails;
import com.umbrella_api.modules.notification.dto.NotificationDto;
import com.umbrella_api.modules.notification.model.DeviceToken;
import com.umbrella_api.modules.notification.repository.DeviceTokenRepository;
import com.umbrella_api.modules.notification.service.NotificationService;

@RestController
@RequestMapping("/api/logged/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final DeviceTokenRepository deviceTokenRepository;

    public NotificationController(NotificationService notificationService,
            DeviceTokenRepository deviceTokenRepository) {
        this.notificationService = notificationService;
        this.deviceTokenRepository = deviceTokenRepository;
    }

    private Long uid(CustomUserDetails user) {
        return user.getUserModel().getId();
    }

    /** Lista as notificações do usuário logado (mais recentes primeiro). */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<NotificationDto>> list(@AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(notificationService.listForUser(uid(user)));
    }

    /** Quantidade de notificações não lidas (para o badge). */
    @GetMapping("/unread-count")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Long>> unreadCount(@AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(Map.of("count", notificationService.unreadCount(uid(user))));
    }

    /** Marca uma notificação como lida. */
    @PostMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<GenericResponse> markRead(
            @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long id) {
        notificationService.markRead(id, uid(user));
        return ResponseEntity.ok(new GenericResponse("ok", "Lida", 200));
    }

    /** Marca todas como lidas. */
    @PostMapping("/read-all")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<GenericResponse> markAllRead(@AuthenticationPrincipal CustomUserDetails user) {
        notificationService.markAllRead(uid(user));
        return ResponseEntity.ok(new GenericResponse("ok", "Todas lidas", 200));
    }

    /** Registra (ou atualiza) o Expo push token do dispositivo do usuário. */
    @PostMapping("/device-token")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<GenericResponse> registerToken(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestBody Map<String, String> body) {
        String token = body.get("token");
        if (token == null || token.isBlank()) {
            return ResponseEntity.badRequest().body(new GenericResponse("error", "token ausente", 400));
        }
        // Se o token já existe, apenas garante o vínculo com este usuário.
        DeviceToken existing = deviceTokenRepository.findByToken(token).orElse(null);
        if (existing == null) {
            deviceTokenRepository.save(DeviceToken.builder().userId(uid(user)).token(token).build());
        } else if (!existing.getUserId().equals(uid(user))) {
            existing.setUserId(uid(user));
            deviceTokenRepository.save(existing);
        }
        return ResponseEntity.ok(new GenericResponse("ok", "Token registrado", 200));
    }
}
