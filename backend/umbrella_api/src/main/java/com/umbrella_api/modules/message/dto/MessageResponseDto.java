package com.umbrella_api.modules.message.dto;

import java.util.List;

import com.umbrella_api.modules.message.model.MessageModel;

/** Mensagem exposta ao app (histórico persistido). */
public record MessageResponseDto(
        Long id,
        Long senderId,
        Long recipientId,
        Long courseId,
        String content,
        String dateTime) {

    public static MessageResponseDto fromEntity(MessageModel m) {
        if (m == null) {
            return null;
        }
        return new MessageResponseDto(
                m.getId(),
                m.getSenderId(),
                m.getRecipientId(),
                m.getCourseId(),
                m.getContent(),
                m.getDateTime() != null ? m.getDateTime().toString() : null);
    }

    public static List<MessageResponseDto> fromList(List<MessageModel> list) {
        if (list == null) {
            return List.of();
        }
        return list.stream().map(MessageResponseDto::fromEntity).toList();
    }
}
