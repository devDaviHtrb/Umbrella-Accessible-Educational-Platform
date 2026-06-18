package com.umbrella_api.modules.storage.repository;

import com.umbrella_api.modules.storage.model.FileMetaData;
import com.umbrella_api.modules.storage.model.Image;
import com.umbrella_api.modules.storage.model.RawFile;

import org.springframework.data.jpa.repository.JpaRepository;

public interface FileMetaDataRepository extends JpaRepository<FileMetaData, Object> {
    FileMetaData findByImage(Image image);

    FileMetaData findByRawFile(RawFile rawFile);
    // JpaRepository methods
}
