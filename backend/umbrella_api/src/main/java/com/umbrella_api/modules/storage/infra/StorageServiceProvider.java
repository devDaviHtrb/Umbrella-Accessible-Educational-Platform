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
import com.umbrella_api.modules.course.repository.ModulesRepository;
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
    private final ModulesRepository modulesRepository;

    public StorageServiceProvider(VideoRepository videoRepository, FileDbService fileDbService,
            ImageRepository imageRepository, RawRepository rawRepository, FileMetaDataRepository fileRepository,
            ExtensionExtractor extractor, ModulesRepository modulesRepository) {
        this.videoRepository = videoRepository;
        this.fileDbService = fileDbService;
        this.imageRepository = imageRepository;
        this.rawRepository = rawRepository;
        this.fileRepository = fileRepository;
        this.extractor = extractor;
        this.modulesRepository = modulesRepository;
    }

    @Transactional
    public GenericResponse upload(MultipartFile file, String resourceType, String alternativeText, String fileName,
            String fileDescription, Long moduleId) {
        /**
         * Uploads a file to the cloud storage and links it to local entities.
         * 
         * NOTE ON MODULE LINKAGE:
         * The 'moduleId' parameter is completely optional. If a 'moduleId' is provided,
         * the system creates a central 'FileMetaData' record to link the file to the
         * course structure.
         * If 'moduleId' is null, the system bypasses metadata generation and directly
         * persists
         * the concrete resource entity (Image, Video, or RawFile) standalone.
         */

        if (moduleId != null && !modulesRepository.existsById(moduleId)) {
            return new GenericResponse("Error", "Module not found", 404);
        }

        FileUploadResponse storageEntityData = null;

        try {
            storageEntityData = fileDbService.upload(file, resourceType, resourceType);

            FileMetaData fileMetaData = null;
            if (moduleId != null) {
                fileMetaData = FileMetaData.builder()
                        .title(fileName)
                        .description(fileDescription)
                        .size(storageEntityData.bytes())
                        .status("ok")
                        .moduleId(moduleId)
                        .build();

                fileMetaData = fileRepository.save(fileMetaData);
            }

            if (resourceType.equalsIgnoreCase("raw")) {
                String fileExtension = extractor.extract(file);
                RawFile entity = RawFile.create(storageEntityData, fileMetaData, fileExtension);
                entity = rawRepository.save(entity);

                if (fileMetaData != null) {
                    fileMetaData.setRawFile(entity);
                    fileRepository.save(fileMetaData);
                }

            } else if (resourceType.equalsIgnoreCase("image")) {
                Image entity = Image.create(storageEntityData, fileMetaData, alternativeText);
                entity = imageRepository.save(entity);

                if (fileMetaData != null) {
                    fileMetaData.setImage(entity);
                    fileRepository.save(fileMetaData);
                }

            } else if (resourceType.equalsIgnoreCase("video")) {
                Video entity = Video.create(storageEntityData, fileMetaData);
                entity = videoRepository.save(entity);

                if (fileMetaData != null) {
                    fileMetaData.setVideo(entity);
                    fileRepository.save(fileMetaData);
                }
            }

            return new GenericResponse("Ok", "Success on upload", 200);

        } catch (Exception e) {
            e.printStackTrace();
            if (storageEntityData != null) {
                try {
                    fileDbService.delete(storageEntityData.publicId(), resourceType);
                } catch (Exception cloudEx) {
                    System.err.println("Failed to delete orphaned file from cloud provider: " + cloudEx.getMessage());
                }
            }
            org.springframework.transaction.interceptor.TransactionAspectSupport
                    .currentTransactionStatus().setRollbackOnly();
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

            } else if (file instanceof Video video) {
                FileMetaData metaData = fileRepository.findByVideo(video);
                if (metaData != null) {
                    metaData.setVideo(null);
                    fileRepository.delete(metaData);
                }
                videoRepository.delete(video);
            }

            fileDbService.delete(file.getFileDbId(), file.getResourceType());
            return new GenericResponse("Ok", "Success on delete", 200);
        } catch (Exception e) {
            e.printStackTrace();
            org.springframework.transaction.interceptor.TransactionAspectSupport
                    .currentTransactionStatus().setRollbackOnly();
            return new GenericResponse("Error", "Error on delete", 400);
        }
    }

    public Optional<Image> getImageById(long id) {
        return imageRepository.findById(id);
    }

    public Optional<RawFile> getRawFileById(long id) {
        return rawRepository.findById(id);
    }

    public Optional<Video> getVideoById(Long id) {
        return videoRepository.findById(id);
    }

    public Optional<StorageFileEntity> findEntityByTypeAndId(String resourceType, Long id) {
        if (resourceType == null || id == null) {
            return Optional.empty();
        }

        if (resourceType.equalsIgnoreCase("image")) {
            return this.getImageById(id).map(file -> file);
        }

        if (resourceType.equalsIgnoreCase("raw")) {
            return this.getRawFileById(id).map(file -> file);
        }

        if (resourceType.equalsIgnoreCase("video")) {
            return this.getVideoById(id).map(file -> file);
        }

        return Optional.empty();
    }
}