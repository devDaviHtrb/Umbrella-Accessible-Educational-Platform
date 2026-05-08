package com.umbrella_api.modules.FileDb.infra;

import java.io.IOException;
import java.util.Map;

import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.umbrella_api.modules.FileDb.exceptions.FileDbException;

@Component
public class CloudinaryProvider {
    private Cloudinary cloudinary;

    public CloudinaryProvider(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    public Map<String, Object> upload(MultipartFile file, String folder, String resourceType) {
        try {
            return this.cloudinary.uploader().upload(file.getBytes(),
                    ObjectUtils.asMap("folder", folder, "resource_type", resourceType.toLowerCase()));
        } catch (IOException e) {
            throw new FileDbException("File processing error", 500, "Internal Server Error");
        } catch (Exception e) {
            throw new FileDbException("Error communicating with the file provider", 502, "Bad Gateway");
        }

    }

    public Map<String, Object> delete(String publicId, String resourceType) {

        try {
            return this.cloudinary.uploader().destroy(publicId,
                    ObjectUtils.asMap("resource_type", resourceType.toLowerCase(), "invalidate", true));
        } catch (Exception e) {
            throw new FileDbException("Something is wrong, we can't delete this file", 400, "Bad Request");
        }

    }
}
