package com.umbrella_api.modules.activity.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.umbrella_api.modules.activity.model.Questions;

public interface QuestionsRepository extends JpaRepository<Questions, Object> {

}
