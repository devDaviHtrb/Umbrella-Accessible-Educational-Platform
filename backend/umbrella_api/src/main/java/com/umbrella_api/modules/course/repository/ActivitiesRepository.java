package com.umbrella_api.modules.course.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.umbrella_api.modules.course.model.Activities;

public interface ActivitiesRepository extends JpaRepository<Activities, Object> {
    List<Activities> findByModuleId(Long subjectId);
}
