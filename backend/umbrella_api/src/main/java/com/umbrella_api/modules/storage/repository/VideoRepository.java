package com.umbrella_api.modules.storage.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.umbrella_api.modules.storage.model.Video;

public interface VideoRepository extends JpaRepository<Video, Object> {

}
