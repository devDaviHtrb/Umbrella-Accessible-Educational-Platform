package com.umbrella_api.modules.FileDb.validations;

import java.util.Arrays;
import java.util.List;

public class FileValidator {

    private static final List<String> ALLOWED_TYPES = Arrays.asList("raw", "image");

    public static void validateResourceType(String resourceType) {
        if (!ALLOWED_TYPES.contains(resourceType.toLowerCase())) {
            throw new IllegalArgumentException("Invalid resource type: " + resourceType);
        }
    }
}
