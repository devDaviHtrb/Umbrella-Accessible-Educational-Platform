package com.umbrella_api.modules.message.repository;

import com.umbrella_api.modules.message.model.MessageModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface MessageRepository extends JpaRepository<MessageModel, Long> {
    List<MessageModel> findBySenderIdAndRecipientIdOrderByDateTimeDesc(
            Long senderId,
            Long recipientId
    );
    List<MessageModel> findByCourseIdOrderByDateTimeDesc(
            Long courseId
    );

    /**
     * Histórico de uma conversa pessoal entre dois usuários (nos dois sentidos),
     * em ordem cronológica.
     */
    @org.springframework.data.jpa.repository.Query(
            "SELECT m FROM MessageModel m WHERE m.courseId IS NULL AND (" +
            "(m.senderId = :a AND m.recipientId = :b) OR " +
            "(m.senderId = :b AND m.recipientId = :a)) ORDER BY m.dateTime ASC")
    List<MessageModel> findConversation(
            @org.springframework.data.repository.query.Param("a") Long a,
            @org.springframework.data.repository.query.Param("b") Long b);

    /** Mensagens de um curso em ordem cronológica. */
    List<MessageModel> findByCourseIdOrderByDateTimeAsc(Long courseId);

    /** Todas as mensagens pessoais que envolvem o usuário (enviadas ou recebidas). */
    @org.springframework.data.jpa.repository.Query(
            "SELECT m FROM MessageModel m WHERE m.courseId IS NULL AND " +
            "(m.senderId = :userId OR m.recipientId = :userId) ORDER BY m.dateTime ASC")
    List<MessageModel> findPersonalForUser(
            @org.springframework.data.repository.query.Param("userId") Long userId);
}
