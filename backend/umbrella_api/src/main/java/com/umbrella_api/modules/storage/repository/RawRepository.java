package com.umbrella_api.modules.storage.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.umbrella_api.modules.storage.model.RawFile;

public interface RawRepository extends JpaRepository<RawFile, Object> {
    // JpaRepository methods
}
