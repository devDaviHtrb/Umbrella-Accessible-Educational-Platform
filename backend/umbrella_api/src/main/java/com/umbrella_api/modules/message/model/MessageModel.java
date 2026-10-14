package com.umbrella_api.modules.message.model;


import com.umbrella_api.modules.course.model.Courses;
import com.umbrella_api.modules.user.model.UserModel;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;

@Entity
@Table(name = "messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageModel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sender_id", nullable = true)
    private Long senderId;

    @Column(name = "recipient_id", nullable = true)
    private Long recipientId;

    @Column(name = "course_id", nullable = true)
    private Long courseId;


    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false)
    private LocalDateTime dateTime;
}
