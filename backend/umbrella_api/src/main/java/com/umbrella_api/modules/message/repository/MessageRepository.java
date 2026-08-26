package com.umbrella_api.modules.message.repository;

import com.umbrella_api.modules.message.model.MessageModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface MessageRepository extends JpaRepository<MessageModel, Long> {
    List<MessageModel> findBySenderIdAndRecipientIdOrderByDateTimeDesc(
            Long SenderId,
            Long RecipientId
    );
    List<MessageModel> findByCourseIdOrderByDateTimeDesc(
            Long CourseId
    );

}
