package com.umbrella_api.modules.storage.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.umbrella_api.modules.storage.model.Image;

@Repository
public interface ImageRepository extends JpaRepository<Image, Object> {
    // JpaRepository methods
}
