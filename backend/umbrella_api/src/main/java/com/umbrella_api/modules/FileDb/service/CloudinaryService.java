package com.umbrella_api.modules.FileDb.service;

import com.umbrella_api.modules.FileDb.infra.CloudinaryProvider;
import com.umbrella_api.modules.FileDb.validations.FileValidator;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.multipart.MultipartFile;

import com.umbrella_api.modules.FileDb.api.FileDbService;
import com.umbrella_api.modules.FileDb.dto.DeleteFileResponse;
import com.umbrella_api.modules.FileDb.dto.FileUploadResponse;

@Validated
@Service
public class CloudinaryService implements FileDbService {
    private final CloudinaryProvider cloudinaryProvider;

    public CloudinaryService(CloudinaryProvider cloudinaryProvider) {
        this.cloudinaryProvider = cloudinaryProvider;

    }

    /*
     * returns Map<String, Object>
     * {
     * "asset_id": String,
     * "public_id": String",
     * "version": int,
     * "width": int (pixels),
     * "height": int (pixels),
     * "format": String (jpg, webp, png, etc...),
     * "resource_type": String (image or raw),
     * "secure_url": String,
     * "bytes": int
     * }
     */
    @Override
    public FileUploadResponse upload(@NotNull MultipartFile file, @NotBlank String folder,
            @NotBlank String resourceType) {

        FileValidator.validateResourceType(resourceType);
        return this.cloudinaryProvider.upload(file, folder, resourceType);

    }

    /*
     * returns Map<String, Object>
     * {
     * "result": String("ok" or "not found")
     * "partial": Bool (This refers to the successful operation of clearing the
     * image database cache.)
     * }
     */
    @Override
    public DeleteFileResponse delete(String publicId, @NotBlank String resourceType) {

        FileValidator.validateResourceType(resourceType);
        return this.cloudinaryProvider.delete(publicId, resourceType);

    }
}
