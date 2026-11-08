package com.umbrella_api.modules.ai.infra;

import com.umbrella_api.common.security.CustomUserDetails;
import com.umbrella_api.modules.ai.model.IaChat;
import com.umbrella_api.modules.ai.model.InteractionRoleEnum;
import com.umbrella_api.modules.ai.model.TutorIaInteractions;
import com.umbrella_api.modules.ai.repository.IaChatRepository;
import com.umbrella_api.modules.ai.repository.TutorIaInteractionsRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class TutorIaProvider {

    private final IaChatRepository chatRepository;
    private final TutorIaInteractionsRepository interactionsRepository;


    public TutorIaProvider(IaChatRepository chatRepository, TutorIaInteractionsRepository interactionsRepository) {
        this.chatRepository = chatRepository;
        this.interactionsRepository = interactionsRepository;
    }



    @Transactional
    public IaChat createNewChat(String title, String summarization, CustomUserDetails userDetails){
        return chatRepository.save(
                IaChat.builder()
                        .title(title)
                        .summarization(summarization)
                        .user(userDetails.getUserModel())
                        .build()
        );
    }


    public List<IaChat> listChatsByUser(Long userId) {
        return chatRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }


    public IaChat getChatById(Long chatId) {
        return chatRepository.findById(chatId)
                .orElseThrow(() -> new IllegalArgumentException("Chat not found with id: " + chatId));
    }


    @Transactional
    public IaChat updateChat(IaChat chat) {
        return chatRepository.save(chat);
    }


    @Transactional
    public void deleteChat(Long chatId) {
        if (!chatRepository.existsById(chatId)) {
            throw new EntityNotFoundException("Chat not found");
        }
        chatRepository.deleteById(chatId);
    }



    @Transactional
    public TutorIaInteractions newInteraction(InteractionRoleEnum role, String content, Long iaChatId){

        IaChat chat = chatRepository.findById(iaChatId)
                .orElseThrow(() -> new EntityNotFoundException("Chat not Found"));


        TutorIaInteractions interaction = TutorIaInteractions.builder()
                .role(role)
                .content(content)
                .iaChat(chat)
                .build();


        return interactionsRepository.save(interaction);
    }


    public List<TutorIaInteractions> listInteractionsByChat(Long iaChatId) {
        return interactionsRepository.findByIaChatIdOrderByCreatedAtAsc(iaChatId);
    }


    @Transactional
    public void deleteInteractionsInBatch(List<TutorIaInteractions> interactions) {
        interactionsRepository.deleteAll(interactions);
    }
}
