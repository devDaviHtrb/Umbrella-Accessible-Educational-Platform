package com.umbrella_api.modules.FileDb.infra;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
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

    // Acima deste tamanho o upload é feito em pedaços (chunked) via uploadLarge,
    // obrigatório para vídeos grandes no Cloudinary e para não estourar a RAM do
    // servidor (Render free = 512MB). 20MB é o limiar recomendado pela lib.
    private static final long LARGE_FILE_THRESHOLD_BYTES = 20L * 1024 * 1024;
    private static final int CHUNK_SIZE_BYTES = 20 * 1024 * 1024;

    public CloudinaryProvider(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    public FileUploadResponse upload(MultipartFile file, String folder, String resourceType) {
        File tempFile = null;
        try {
            Map<String, Object> params = ObjectUtils.asMap(
                    "folder", folder,
                    "resource_type", resourceType.toLowerCase());

            Map<String, Object> result;

            if (file.getSize() > LARGE_FILE_THRESHOLD_BYTES) {
                // Arquivos grandes: gravamos num temporário em disco e enviamos
                // em pedaços. Evita carregar o arquivo inteiro na memória
                // (file.getBytes) e respeita o limite do upload simples do
                // Cloudinary.
                tempFile = File.createTempFile("upload-", "-" + sanitize(file.getOriginalFilename()));
                file.transferTo(tempFile);

                Map<String, Object> largeParams = ObjectUtils.asMap(
                        "folder", folder,
                        "resource_type", resourceType.toLowerCase(),
                        "chunk_size", CHUNK_SIZE_BYTES);

                result = cloudinary.uploader().uploadLarge(tempFile, largeParams);
            } else {
                result = cloudinary.uploader().upload(file.getBytes(), params);
            }

            return new FileUploadResponse(
                    (String) result.get("secure_url"),
                    (String) result.get("public_id"),
                    (String) result.get("format"),
                    (String) result.get("resource_type"),
                    (Integer) result.get("width"),
                    (Integer) result.get("height"),
                    (Integer) result.get("bytes"),
                    (Double) result.get("duration"));

        } catch (IOException e) {
            throw new IllegalArgumentException("Failed to process the uploaded file. It may be corrupted.", e);
        } catch (Exception e) {
            throw new IllegalStateException("Cloud storage provider integration failed. Could not upload file.", e);
        } finally {
            if (tempFile != null) {
                try {
                    Files.deleteIfExists(tempFile.toPath());
                } catch (IOException ignored) {
                    // Arquivo temporário: falha ao apagar não deve quebrar o upload.
                }
            }
        }

    }

    /** Remove caracteres problemáticos do nome original ao compor o temporário. */
    private String sanitize(String name) {
        if (name == null || name.isBlank()) {
            return "file";
        }
        return name.replaceAll("[^a-zA-Z0-9._-]", "_");
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
