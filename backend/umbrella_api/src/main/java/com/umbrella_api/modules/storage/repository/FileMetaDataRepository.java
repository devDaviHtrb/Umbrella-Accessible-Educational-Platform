package com.umbrella_api.modules.storage.repository;

import com.umbrella_api.modules.storage.model.FileMetaData;
import com.umbrella_api.modules.storage.model.Image;
import com.umbrella_api.modules.storage.model.RawFile;
import com.umbrella_api.modules.storage.model.Video;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FileMetaDataRepository extends JpaRepository<FileMetaData, Object> {
    FileMetaData findByImage(Image image);

    FileMetaData findByRawFile(RawFile rawFile);
    // JpaRepository methods

    FileMetaData findByVideo(Video video);

    @Query("SELECT f FROM FileMetaData f LEFT JOIN FETCH f.image LEFT JOIN FETCH f.rawFile LEFT JOIN FETCH f.video WHERE f.module.id = :id")
    List<FileMetaData> findByModuleId(@Param("id") Long id);
}
