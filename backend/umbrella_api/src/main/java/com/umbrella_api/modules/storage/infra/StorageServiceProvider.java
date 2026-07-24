package com.umbrella_api.modules.storage.infra;

import com.umbrella_api.modules.storage.repository.VideoRepository;
import com.umbrella_api.modules.storage.util.ExtensionExtractor;
import com.umbrella_api.modules.user.model.UserModel;
import com.umbrella_api.modules.user.repository.UserRepository;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.umbrella_api.common.dto.GenericResponse;
import com.umbrella_api.common.security.CustomUserDetails;
import com.umbrella_api.modules.FileDb.api.FileDbService;
import com.umbrella_api.modules.FileDb.dto.FileUploadResponse;
import com.umbrella_api.modules.course.model.Modules;
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
    private final UserRepository userRepository;

    public StorageServiceProvider(VideoRepository videoRepository, FileDbService fileDbService,
            ImageRepository imageRepository, RawRepository rawRepository, FileMetaDataRepository fileRepository,
            ExtensionExtractor extractor, ModulesRepository modulesRepository, UserRepository userRepository) {
        this.videoRepository = videoRepository;
        this.fileDbService = fileDbService;
        this.imageRepository = imageRepository;
        this.rawRepository = rawRepository;
        this.fileRepository = fileRepository;
        this.extractor = extractor;
        this.modulesRepository = modulesRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public GenericResponse upload(MultipartFile file, String resourceType, String alternativeText, String fileName,
            String fileDescription, Long moduleId, CustomUserDetails loggedUser) {
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
                Modules module = modulesRepository.findById(moduleId).get();
                fileMetaData = FileMetaData.builder()
                        .title(fileName)
                        .description(fileDescription)
                        .size(storageEntityData.bytes())
                        .status("ok")
                        .module(module)
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

                if (fileMetaData == null) {
                    UserModel user = loggedUser.getUserModel();
                    entity.setUser(user);
                }

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

    @Transactional
    public void deleteAllFilesByModuleId(Long moduleId) {

        List<FileMetaData> metaList = fileRepository.findByModuleId(moduleId);

        for (FileMetaData meta : metaList) {
            StorageFileEntity realFile = null;
            if (meta.getImage() != null)
                realFile = meta.getImage();
            else if (meta.getVideo() != null)
                realFile = meta.getVideo();
            else if (meta.getRawFile() != null)
                realFile = meta.getRawFile();

            if (realFile != null) {
                this.delete(realFile);
            }
        }
    }

    // It have to be implemented in the future
    /*
     * @Transactional
     * public void deleteAllFilesByQuestionId(Long questionId) {
     * 
     * List<FileMetaData> metaList = fileRepository.findByQuestionId(questionId);
     * 
     * for (FileMetaData meta : metaList) {
     * StorageFileEntity realFile = null;
     * if (meta.getImage() != null)
     * realFile = meta.getImage();
     * else if (meta.getVideo() != null)
     * realFile = meta.getVideo();
     * else if (meta.getRawFile() != null)
     * realFile = meta.getRawFile();
     * 
     * if (realFile != null) {
     * this.delete(realFile);
     * }
     * }
     * }
     */
}