package com.umbrella_api.modules.storage.api;

import org.springframework.web.multipart.MultipartFile;

import com.umbrella_api.common.dto.GenericResponse;
import com.umbrella_api.modules.storage.model.Image;
import com.umbrella_api.modules.storage.model.RawFile;
import com.umbrella_api.modules.storage.model.StorageFileEntity;

public interface StorageService {
    public GenericResponse upload(MultipartFile file, String resourceType, String alternativeText, String fileName);

    public GenericResponse delete(StorageFileEntity file);

    public Image getImageById(long id);

    public RawFile getRawFileById(long id);

}
