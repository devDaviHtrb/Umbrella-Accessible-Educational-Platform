package com.umbrella_api.modules.storage.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.umbrella_api.modules.storage.model.Subtitle;
import com.umbrella_api.modules.storage.model.SubtitleKind;

public interface SubtitleRepository extends JpaRepository<Subtitle, Long> {

    List<Subtitle> findByVideoId(Long videoId);

    Optional<Subtitle> findByVideoIdAndKind(Long videoId, SubtitleKind kind);
}
