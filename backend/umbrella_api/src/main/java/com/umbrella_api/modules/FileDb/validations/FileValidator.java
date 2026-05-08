package com.umbrella_api.modules.FileDb.validations;

import com.umbrella_api.modules.FileDb.exceptions.FileDbException;
import org.springframework.web.multipart.MultipartFile;
import java.util.Arrays;
import java.util.List;

public class FileValidator {

    private static final List<String> ALLOWED_TYPES = Arrays.asList("raw", "image");

    public static void validateUpload(MultipartFile file, String resourceType) {
        if (file == null || file.isEmpty()) {
            throw new FileDbException("Empty file", 400, "Bad Request");
        }
        validateResourceType(resourceType);
    }

    public static void validateDelete(String publicId, String resourceType) {
        if (publicId == null || publicId.isEmpty()) {
            throw new FileDbException("Invalid cloudinary public id", 400, "Bad Request");
        }
        validateResourceType(resourceType);
    }

    private static void validateResourceType(String resourceType) {
        if (resourceType == null || !ALLOWED_TYPES.contains(resourceType.toLowerCase())) {
            throw new FileDbException("Invalid resource type: " + resourceType, 400, "Bad Request");
        }
    }
}
