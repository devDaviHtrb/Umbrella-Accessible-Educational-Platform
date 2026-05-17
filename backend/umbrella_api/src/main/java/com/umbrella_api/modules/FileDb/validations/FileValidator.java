package com.umbrella_api.modules.FileDb.validations;

import org.springframework.web.multipart.MultipartFile;
import java.util.Arrays;
import java.util.List;

public class FileValidator {

    private static final List<String> ALLOWED_TYPES = Arrays.asList("raw", "image");

    public static void validateUpload(MultipartFile file, String resourceType) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Empty file");
        }
        validateResourceType(resourceType);
    }

    public static void validateDelete(String publicId, String resourceType) {
        if (publicId == null || publicId.isEmpty()) {
            throw new IllegalArgumentException("Invalid value");
        }
        validateResourceType(resourceType);
    }

    private static void validateResourceType(String resourceType) {
        if (resourceType == null || !ALLOWED_TYPES.contains(resourceType.toLowerCase())) {
            throw new IllegalArgumentException("Invalid resource type: " + resourceType);
        }
    }
}
