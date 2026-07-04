package com.umbrella_api.modules.course.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.umbrella_api.modules.course.model.Questions;

public interface QuestionsRepository extends JpaRepository<Questions, Object> {

}
