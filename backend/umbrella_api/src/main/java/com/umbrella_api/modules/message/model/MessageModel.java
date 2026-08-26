package com.umbrella_api.modules.message.model;


import com.umbrella_api.modules.course.model.Courses;
import com.umbrella_api.modules.user.model.UserModel;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;

@Entity
@Table(name = "message")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageModel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = true)
    private Long sender_id;

    @Column(nullable = true)
    private Long recipient_id;

    @Column(nullable = true)
    private Long course_id;


    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false)
    private LocalDateTime dateTime;
}
