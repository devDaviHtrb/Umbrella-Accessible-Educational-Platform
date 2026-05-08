package com.umbrella_api.modules.FileDb.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.umbrella_api.modules.FileDb.model.Image;

@Repository
public interface ImageRepository extends JpaRepository<Image, Object> {
    // JpaRepository methods
}
