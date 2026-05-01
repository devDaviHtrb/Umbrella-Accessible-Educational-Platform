package com.umbrella_api.modules.ImageDb.service;

import java.io.IOException;
import java.util.Map;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;

public class UploadImageService {
    private final Cloudinary cloudinary;

    public UploadImageService(Cloudinary cloudinary) {
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

    public Map<String, Object> uploadImage(Object file, String folder) throws IOException {
        return cloudinary.uploader().upload(file,
                ObjectUtils.asMap("folder", folder));
    }

}