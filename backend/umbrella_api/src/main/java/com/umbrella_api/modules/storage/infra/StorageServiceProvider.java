package com.umbrella_api.modules.storage.infra;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import com.umbrella_api.common.dto.GenericResponse;
import com.umbrella_api.modules.FileDb.api.FileDbService;
import com.umbrella_api.modules.FileDb.dto.FileUploadResponse;
import com.umbrella_api.modules.storage.model.Image;
import com.umbrella_api.modules.storage.model.RawFile;
import com.umbrella_api.modules.storage.model.StorageFileEntity;
import com.umbrella_api.modules.storage.repository.ImageRepository;
import com.umbrella_api.modules.storage.repository.RawRepository;

@Component
public class StorageServiceProvider {
    @Autowired
    private FileDbService fileDbService;

    @Autowired
    private ImageRepository imageRepository;

    @Autowired
    private RawRepository rawRepository;

    public GenericResponse upload(MultipartFile file, String resourceType, String alternativeText, String fileName) {
        FileUploadResponse storageEntityData = fileDbService.upload(file, resourceType, resourceType);

        try {
            if (resourceType.equalsIgnoreCase("raw")) {
                RawFile entity = RawFile.builder()
                        .fileDbId(storageEntityData.publicId())
                        .url(storageEntityData.url())
                        .name(fileName)
                        .build();

                rawRepository.save(entity);

            } else if (resourceType.equalsIgnoreCase("image")) {
                Image entity = Image.builder()
                        .fileDbId(storageEntityData.publicId())
                        .url(storageEntityData.url())
                        .name(fileName)
                        .alternativeText(alternativeText != null ? alternativeText : "Without description")
                        .width(storageEntityData.width())
                        .height(storageEntityData.height())
                        .build();
                // create a validation after
                imageRepository.save(entity);
            }

            return new GenericResponse("Ok", "Success on upload", 200);

        } catch (Exception e) {
            return new GenericResponse("Error", "Error on upload", 400);
            // Add a specific exception after
        }

    }

    public GenericResponse delete(StorageFileEntity file) {
        /*
         * IMPORTANT: We delete from the local database BEFORE the cloud provider.
         * This ensures data integrity: if the database transaction fails, the cloud
         * file remains untouched, preventing "orphaned" cloud files with no DB record.
         */
        try {
            if (file instanceof Image img) {
                imageRepository.delete(img);
            } else if (file instanceof RawFile raw) {
                rawRepository.delete(raw);
            }

            fileDbService.delete(file.getFileDbId(), file.getResourceType());
            return new GenericResponse("Ok", "Success on delete", 200);
        } catch (Exception e) {
            return new GenericResponse("Error", "Error on delete", 400);
            // Add a specific exception after
        }

    }

    public Optional<Image> getImageById(long id) {
        // add error handling after
        return imageRepository.findById(id);
    }

    public Optional<RawFile> getRawFileById(long id) {
        // add error handling after
        return rawRepository.findById(id);
    }

}
