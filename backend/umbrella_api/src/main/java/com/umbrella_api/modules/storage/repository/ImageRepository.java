package com.umbrella_api.modules.storage.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.umbrella_api.modules.storage.model.Image;

public interface ImageRepository extends JpaRepository<Image, Object> {
    java.util.Optional<Image> findTopByUserIdOrderByIdDesc(Long userId);
}
