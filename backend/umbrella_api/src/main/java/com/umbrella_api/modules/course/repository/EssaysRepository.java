package com.umbrella_api.modules.course.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.umbrella_api.modules.course.model.Essays;

public interface EssaysRepository extends JpaRepository<Essays, Object> {

}
