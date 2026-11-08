package com.umbrella_api.modules.ai.repository;

import com.umbrella_api.modules.ai.model.IaChat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IaChatRepository extends JpaRepository<IaChat, Long> {
    List<IaChat> findByUserIdOrderByCreatedAtDesc(Long userId);
}
