package com.umbrella_api.modules.ai.api;

import com.umbrella_api.common.security.CustomUserDetails;
import com.umbrella_api.modules.ai.dto.AiResponse;
import com.umbrella_api.modules.ai.model.IaChat;
import com.umbrella_api.modules.ai.model.TutorIaInteractions;

import java.util.List;

public interface AiService {
    String chatTutor(Long chatId, String ask);

    IaChat startNewChat(String title, CustomUserDetails userDetails);

    List<IaChat> getChatsByUser(Long userId);

    IaChat getChatById(Long chatId);

    List<TutorIaInteractions> getChatHistory(Long chatId);

    void removeChat(Long chatId);

}
