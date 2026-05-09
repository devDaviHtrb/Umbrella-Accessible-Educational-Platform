package com.umbrella_api.modules.storage.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.umbrella_api.common.dto.GenericResponse;
import com.umbrella_api.modules.storage.api.StorageService;
import com.umbrella_api.modules.storage.infra.StorageServiceProvider;
import com.umbrella_api.modules.storage.model.Image;
import com.umbrella_api.modules.storage.model.RawFile;
import com.umbrella_api.modules.storage.model.StorageFileEntity;

import jakarta.persistence.EntityNotFoundException;

@Service
public class StorageServiceImpl implements StorageService {

    @Autowired
    private StorageServiceProvider storageServiceProvider;

    @Override
    public GenericResponse upload(MultipartFile file, String resourceType, String alternativeText, String fileName) {
        return storageServiceProvider.upload(file, resourceType, alternativeText, fileName);
    }

    @Override
    public GenericResponse delete(StorageFileEntity file) {
        return storageServiceProvider.delete(file);
    }

    @Override
    public Image getImageById(long id) {
        return storageServiceProvider.getImageById(id)
                .orElseThrow(() -> new EntityNotFoundException("Image not found")); // create a generic not found
                                                                                    // exception later
    }

    @Override
    public RawFile getRawFileById(long id) {
        return storageServiceProvider.getRawFileById(id)
                .orElseThrow(() -> new EntityNotFoundException("Image not found")); // create a generic not found
                                                                                    // exception later
    }

}
