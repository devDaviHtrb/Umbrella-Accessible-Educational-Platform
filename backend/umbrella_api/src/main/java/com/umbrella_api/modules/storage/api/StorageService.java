package com.umbrella_api.modules.storage.api;

import org.springframework.web.multipart.MultipartFile;

import com.umbrella_api.common.dto.GenericResponse;
import com.umbrella_api.common.security.CustomUserDetails;
import com.umbrella_api.modules.storage.common.StorageFileEntity;
import com.umbrella_api.modules.storage.dto.ImageResponseDto;
import com.umbrella_api.modules.storage.dto.RawFileResponseDto;
import com.umbrella_api.modules.storage.dto.VideoResponseDto;

public interface StorageService {
    public GenericResponse upload(MultipartFile file, String resourceType, String alternativeText, String fileName,
            String fileDescription, Long moduleId, CustomUserDetails loggedUser);

    public GenericResponse delete(StorageFileEntity file);

    public ImageResponseDto getImageById(long id);

    public RawFileResponseDto getRawFileById(long id);

    public VideoResponseDto getVideoById(long id);

    public StorageFileEntity findEntityByTypeAndId(String resourceType, Long id);

    public void deleteAllFilesByModuleId(Long moduleId);
}
