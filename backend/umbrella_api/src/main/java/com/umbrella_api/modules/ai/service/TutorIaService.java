package com.umbrella_api.modules.ai.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.umbrella_api.common.security.CustomUserDetails;
import com.umbrella_api.modules.ai.api.AiService;
import org.springframework.stereotype.Service;
import jakarta.transaction.Transactional;

import com.umbrella_api.modules.ai.dto.AiResponse;
import com.umbrella_api.modules.ai.infra.GeminiProvider;
import com.umbrella_api.modules.ai.infra.TutorIaProvider;
import com.umbrella_api.modules.ai.model.IaChat;
import com.umbrella_api.modules.ai.model.InteractionRoleEnum;
import com.umbrella_api.modules.ai.model.TutorIaInteractions;

@Service
public class TutorIaService implements AiService {

    private final TutorIaProvider tutorIaProvider;
    private final GeminiProvider geminiProvider;

    public TutorIaService(TutorIaProvider tutorIaProvider, GeminiProvider geminiProvider) {
        this.tutorIaProvider = tutorIaProvider;
        this.geminiProvider = geminiProvider;
    }

    @Transactional
    public String chatTutor(Long chatId, String ask) {
        IaChat chat = tutorIaProvider.getChatById(chatId);

        tutorIaProvider.newInteraction(InteractionRoleEnum.USER, ask, chatId);

        List<TutorIaInteractions> dbHistory = tutorIaProvider.listInteractionsByChat(chatId);

        List<Map<String, String>> mappedHistory = dbHistory.stream().map(interaction -> {
            Map<String, String> map = new HashMap<>();
            String role = interaction.getRole() == InteractionRoleEnum.TUTOR ? "model" : "user";
            map.put("role", role);
            map.put("content", interaction.getContent());
            return map;
        }).collect(Collectors.toList());

        AiResponse aiResponse = geminiProvider.requestAi(chat.getSummarization(), mappedHistory);
        String aiReply = aiResponse.reply();

        tutorIaProvider.newInteraction(InteractionRoleEnum.TUTOR, aiReply, chatId);

        if (dbHistory.size() >= 20) {
            executeSummarization(chat, dbHistory);
        }

        return aiReply;
    }

    private void executeSummarization(IaChat chat, List<TutorIaInteractions> completeHistory) {
        String commandPrompt = "Generate a compact summary of the student's progress so far, " +
                "highlighting what they have already learned and what their biggest doubts were based on this history.";

        List<Map<String, String>> historyForSummary = completeHistory.stream().map(interaction -> {
            Map<String, String> map = new HashMap<>();
            String role = interaction.getRole() == InteractionRoleEnum.TUTOR ? "model" : "user";
            map.put("role", role);
            map.put("content", interaction.getContent());
            return map;
        }).collect(Collectors.toList());

        historyForSummary.add(Map.of("role", "user", "content", commandPrompt));

        AiResponse aiResponse = geminiProvider.requestAi(chat.getSummarization(), historyForSummary);
        String newSummary = aiResponse.reply();

        chat.setSummarization(newSummary);
        tutorIaProvider.updateChat(chat);
    }

    @Transactional
    public IaChat startNewChat(String title, CustomUserDetails userDetails) {
        return tutorIaProvider.createNewChat(title, "", userDetails);
    }

    public List<IaChat> getChatsByUser(Long userId) {
        return tutorIaProvider.listChatsByUser(userId);
    }

    public IaChat getChatById(Long chatId) {
        return tutorIaProvider.getChatById(chatId);
    }

    public List<TutorIaInteractions> getChatHistory(Long chatId) {
        return tutorIaProvider.listInteractionsByChat(chatId);
    }

    @Transactional
    public void removeChat(Long chatId) {
        tutorIaProvider.deleteChat(chatId);
    }


}
