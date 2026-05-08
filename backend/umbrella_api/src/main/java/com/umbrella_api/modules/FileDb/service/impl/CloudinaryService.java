package com.umbrella_api.modules.FileDb.service.impl;

import java.io.IOException;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.umbrella_api.modules.FileDb.exceptions.FileDbException;
import com.umbrella_api.modules.FileDb.repository.ImageRepository;
import com.umbrella_api.modules.FileDb.service.FileDbService;
import com.umbrella_api.modules.FileDb.validations.FileValidator;

@Service
public class CloudinaryService implements FileDbService {
    private Cloudinary cloudinary;

    public CloudinaryService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
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
    public Map<String, Object> upload(MultipartFile file, String folder, String resourceType) {

        FileValidator.validateUpload(file, resourceType);

        try {
            return cloudinary.uploader().upload(file.getBytes(),
                    ObjectUtils.asMap("folder", folder, "resource_type", resourceType.toLowerCase()));
        } catch (IOException e) {
            throw new FileDbException("File processing error", 500, "Internal Server Error");
        } catch (Exception e) {
            throw new FileDbException("Error communicating with the file provider", 502, "Bad Gateway");
        }

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
    public Map<String, Object> delete(String publicId, String resourceType) {

        FileValidator.validateDelete(publicId, resourceType);

        try {
            return cloudinary.uploader().destroy(publicId,
                    ObjectUtils.asMap("resource_type", resourceType.toLowerCase(), "invalidate", true));
        } catch (Exception e) {
            throw new FileDbException("Something is wrong, we can't delete this file", 400, "Bad Request");
        }

    }
}
