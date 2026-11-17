package com.umbrella_api.modules.notification.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Token de push (Expo Push Token) de um dispositivo, por usuário. Usado para
 * enviar notificações push ao celular via o serviço Expo Push.
 */
@Entity
@Table(name = "device_tokens")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeviceToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    /** Expo push token, ex. "ExponentPushToken[xxxxxxxx]". Único. */
    @Column(nullable = false, unique = true, length = 512)
    private String token;
}
