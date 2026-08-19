package com.umbrella_api.modules.schedule.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.umbrella_api.modules.user.model.UserModel;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserEvents {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private UserModel user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Events event;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventStatus status = EventStatus.PENDING;

    @Column(name = "reminder_offset")
    private Integer reminderOffset; // ex: 30 minutes before
}
