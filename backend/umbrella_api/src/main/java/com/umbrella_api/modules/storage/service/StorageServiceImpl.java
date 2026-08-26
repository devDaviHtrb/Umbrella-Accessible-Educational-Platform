package com.umbrella_api.modules.storage.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.umbrella_api.common.dto.GenericResponse;
import com.umbrella_api.common.security.CustomUserDetails;
import com.umbrella_api.modules.FileDb.dto.FileUploadResponse;
import com.umbrella_api.modules.storage.api.StorageService;
import com.umbrella_api.modules.storage.common.StorageFileEntity;
import com.umbrella_api.modules.storage.dto.ImageResponseDto;
import com.umbrella_api.modules.storage.dto.RawFileResponseDto;
import com.umbrella_api.modules.storage.dto.VideoResponseDto;
import com.umbrella_api.modules.storage.infra.StorageServiceProvider;
import com.umbrella_api.modules.storage.model.Image;
import com.umbrella_api.modules.storage.model.RawFile;
import com.umbrella_api.modules.storage.model.Video;

import jakarta.persistence.EntityNotFoundException;

@Service
public class StorageServiceImpl implements StorageService {

    private final StorageServiceProvider storageServiceProvider;

    StorageServiceImpl(StorageServiceProvider storageServiceProvider) {
        this.storageServiceProvider = storageServiceProvider;
    }

    @Override
    public FileUploadResponse upload(MultipartFile file, String resourceType, String alternativeText, String fileName,
            String fileDescription, Long moduleId, CustomUserDetails loggedUser) {
        return storageServiceProvider.upload(file, resourceType, alternativeText, fileName, fileDescription, moduleId,
                loggedUser);
    }

    @Override
    public GenericResponse delete(StorageFileEntity file) {
        return storageServiceProvider.delete(file);
    }

    @Override
    public ImageResponseDto getImageById(long id) {
        Image image = storageServiceProvider.getImageById(id)
                .orElseThrow(() -> new EntityNotFoundException("Image not found")); // create a generic not found
                                                                                    // exception later
        return ImageResponseDto.fromEntity(image);
    }

    @Override
    public RawFileResponseDto getRawFileById(long id) {
        RawFile file = storageServiceProvider.getRawFileById(id)
                .orElseThrow(() -> new EntityNotFoundException("Image not found")); // create a generic not found
                                                                                    // exception later
        return RawFileResponseDto.fromEntity(file);
    }

    @Override
    public VideoResponseDto getVideoById(long id) {
        Video video = storageServiceProvider.getVideoById(id)
                .orElseThrow(() -> new EntityNotFoundException("Video not found")); // create a generic not found
                                                                                    // exception later
        return VideoResponseDto.fromEntity(video);
    }

    @Override
    public StorageFileEntity findEntityByTypeAndId(String resourceType, Long id) {
        return storageServiceProvider.findEntityByTypeAndId(resourceType, id)
                .orElseThrow(() -> new EntityNotFoundException("File not found")); // create a generic not found
                                                                                   // exception later
    }

    @Override
    public void deleteAllFilesByModuleId(Long moduleId) {
        storageServiceProvider.deleteAllFilesByModuleId(moduleId);
    }

}
