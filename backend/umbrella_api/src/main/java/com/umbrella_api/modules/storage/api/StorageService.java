package com.umbrella_api.modules.storage.api;

import java.util.Optional;

import org.springframework.web.multipart.MultipartFile;

import com.umbrella_api.common.dto.GenericResponse;
import com.umbrella_api.modules.storage.common.StorageFileEntity;
import com.umbrella_api.modules.storage.model.Image;
import com.umbrella_api.modules.storage.model.RawFile;
import com.umbrella_api.modules.storage.model.Video;

public interface StorageService {
    public GenericResponse upload(MultipartFile file, String resourceType, String alternativeText, String fileName,
            String fileDescription);

    public GenericResponse delete(StorageFileEntity file);

    public Image getImageById(long id);

    public RawFile getRawFileById(long id);

    public Video getVideoById(long id);

    public StorageFileEntity findEntityByTypeAndId(String resourceType, Long id);

}
