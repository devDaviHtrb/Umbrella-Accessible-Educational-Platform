package com.umbrella_api.modules.storage.infra;

import com.umbrella_api.modules.storage.repository.VideoRepository;
import com.umbrella_api.modules.storage.util.ExtensionExtractor;

import java.util.Optional;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.umbrella_api.common.dto.GenericResponse;
import com.umbrella_api.modules.FileDb.api.FileDbService;
import com.umbrella_api.modules.FileDb.dto.FileUploadResponse;
import com.umbrella_api.modules.storage.common.StorageFileEntity;
import com.umbrella_api.modules.storage.model.FileMetaData;
import com.umbrella_api.modules.storage.model.Image;
import com.umbrella_api.modules.storage.model.RawFile;
import com.umbrella_api.modules.storage.model.Video;
import com.umbrella_api.modules.storage.repository.FileMetaDataRepository;
import com.umbrella_api.modules.storage.repository.ImageRepository;
import com.umbrella_api.modules.storage.repository.RawRepository;

@Component
public class StorageServiceProvider {
    private final VideoRepository videoRepository;
    private final FileDbService fileDbService;
    private final ImageRepository imageRepository;
    private final RawRepository rawRepository;
    private final FileMetaDataRepository fileRepository;
    private final ExtensionExtractor extractor;

    public StorageServiceProvider(VideoRepository videoRepository, ImageRepository imageRepository,
            FileDbService fileDbService, RawRepository rawRepository,
            FileMetaDataRepository fileRepository, ExtensionExtractor extractor) {
        this.videoRepository = videoRepository;
        this.imageRepository = imageRepository;
        this.fileDbService = fileDbService;
        this.rawRepository = rawRepository;
        this.fileRepository = fileRepository;
        this.extractor = extractor;
    }

    @Transactional
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

            fileMetaData = fileRepository.save(fileMetaData);

            if (resourceType.equalsIgnoreCase("raw")) {

                String fileExtension = extractor.extract(file);

                RawFile entity = RawFile.create(storageEntityData, fileMetaData, fileExtension);
                entity = rawRepository.save(entity);

                fileMetaData.setRawFile(entity);

            } else if (resourceType.equalsIgnoreCase("image")) {

                Image entity = Image.create(storageEntityData, fileMetaData, alternativeText);
                entity = imageRepository.save(entity);
                fileMetaData.setImage(entity);

            } else if (resourceType.equalsIgnoreCase("video")) {

                Video entity = Video.create(storageEntityData, fileMetaData);
                entity = videoRepository.save(entity);
                fileMetaData.setVideo(entity);
            }

            fileRepository.save(fileMetaData);

            return new GenericResponse("Ok", "Success on upload", 200);

        } catch (Exception e) {
            e.printStackTrace();
            return new GenericResponse("Error", "Error on upload", 400);
        }
    }

    @Transactional
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
            e.printStackTrace();
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

    public Optional<Video> getVideoById(Long id) {
        return videoRepository.findById(id);
    }
}
