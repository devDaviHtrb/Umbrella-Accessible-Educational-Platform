package com.umbrella_api.modules.storage.util;

import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
public class ExtensionExtractor {
    public String extract(MultipartFile file) {
        String fileExtension = "unknown";
        String originalFilename = file.getOriginalFilename();

        if (originalFilename != null && originalFilename.contains(".")) {
            fileExtension = originalFilename.substring(originalFilename.lastIndexOf(".") + 1);
        } else if (file.getContentType() != null && file.getContentType().contains("/")) {
            String contentType = file.getContentType();
            fileExtension = contentType.substring(contentType.indexOf("/") + 1);
        }

        return fileExtension;
    }
}
