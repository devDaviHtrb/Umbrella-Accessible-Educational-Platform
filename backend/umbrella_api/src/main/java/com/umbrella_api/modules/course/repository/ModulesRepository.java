package com.umbrella_api.modules.course.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.umbrella_api.modules.course.model.Modules;

public interface ModulesRepository extends JpaRepository<Modules, Object> {
    List<Modules> findByCourseId(Long courseId);
}
