package com.umbrella_api.modules.ai.repository;

import com.umbrella_api.modules.ai.model.TutorIaInteractions;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TutorIaInteractionsRepository extends JpaRepository<TutorIaInteractions, Long> {
    List<TutorIaInteractions> findByIaChatIdOrderByCreatedAtAsc(Long iaChatId);
}
