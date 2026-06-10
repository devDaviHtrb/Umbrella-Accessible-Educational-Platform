package com.umbrella_api.modules.storage.infra;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import com.umbrella_api.common.dto.GenericResponse;
import com.umbrella_api.modules.FileDb.api.FileDbService;
import com.umbrella_api.modules.FileDb.dto.FileUploadResponse;
import com.umbrella_api.modules.storage.common.StorageFileEntity;
import com.umbrella_api.modules.storage.model.FileMetaData;
import com.umbrella_api.modules.storage.model.Image;
import com.umbrella_api.modules.storage.model.RawFile;
import com.umbrella_api.modules.storage.repository.FileMetaDataRepository;
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

    @Autowired
    private FileMetaDataRepository fileRepository;

    public GenericResponse upload(MultipartFile file, String resourceType, String alternativeText, String fileName,
            String fileDescription) {
        FileUploadResponse storageEntityData = fileDbService.upload(file, resourceType, resourceType);

        FileMetaData fileMetaData = FileMetaData.builder()
                .title(fileName)
                .description(fileDescription)
                .size(storageEntityData.bytes())
                .status("ok")
                .build();

        try {
            if (resourceType.equalsIgnoreCase("raw")) {
                RawFile entity = RawFile.builder()
                        .fileDbId(storageEntityData.publicId())
                        .url(storageEntityData.url())
                        .fileMetaData(fileMetaData)
                        .build();

                entity = rawRepository.save(entity);
                fileMetaData.setRawFile(entity);

            } else if (resourceType.equalsIgnoreCase("image")) {
                Image entity = Image.builder()
                        .fileDbId(storageEntityData.publicId())
                        .url(storageEntityData.url())
                        .alternativeText(alternativeText != null ? alternativeText : "Without description")
                        .width(storageEntityData.width())
                        .height(storageEntityData.height())
                        .fileMetaData(fileMetaData)
                        .build();

                // create a validation after
                entity = imageRepository.save(entity);
                fileMetaData.setImage(entity);
            }

            fileRepository.save(fileMetaData);

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
                FileMetaData metaData = fileRepository.findByImage(img);

                if (metaData != null) {
                    metaData.setImage(null);
                    fileRepository.delete(metaData);
                }

                imageRepository.delete(img);
            } else if (file instanceof RawFile raw) {
                FileMetaData metaData = fileRepository.findByRawFile(raw);
                if (metaData != null) {
                    metaData.setRawFile(null);
                    fileRepository.delete(metaData);
                }

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
