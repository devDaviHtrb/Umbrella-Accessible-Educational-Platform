package com.umbrella_api.modules.FileDb.infra;

import java.io.IOException;
import java.util.Map;

import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.umbrella_api.modules.FileDb.dto.DeleteFileResponse;
import com.umbrella_api.modules.FileDb.dto.FileUploadResponse;

@Component
public class CloudinaryProvider {
    private Cloudinary cloudinary;

    public CloudinaryProvider(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    public FileUploadResponse upload(MultipartFile file, String folder, String resourceType) {
        try {
            Map<String, Object> result = cloudinary.uploader().upload(file.getBytes(),
                    ObjectUtils.asMap("folder", folder, "resource_type", resourceType.toLowerCase()));

            return new FileUploadResponse(
                    (String) result.get("secure_url"),
                    (String) result.get("public_id"),
                    (String) result.get("format"),
                    (String) result.get("resource_type"),
                    (int) result.get("width"),
                    (int) result.get("height"));

        } catch (IOException e) {
            throw new IllegalArgumentException("Failed to process the uploaded file. It may be corrupted.", e);
        } catch (Exception e) {
            throw new IllegalStateException("Cloud storage provider integration failed. Could not upload file.", e);
        }

    }

    public DeleteFileResponse delete(String publicId, String resourceType) {

        try {
            Map<String, Object> result = this.cloudinary.uploader().destroy(publicId,
                    ObjectUtils.asMap("resource_type", resourceType.toLowerCase(), "invalidate", true));

            return new DeleteFileResponse(
                    (String) result.get("result"),
                    (Boolean) result.get("partial"));

        } catch (Exception e) {
            throw new IllegalStateException("Something went wrong, we couldn't delete this file from cloud storage", e);
        }

    }
}
