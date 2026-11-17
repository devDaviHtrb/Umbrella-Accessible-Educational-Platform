package com.umbrella_api.modules.storage.controller;

import com.umbrella_api.common.dto.GenericResponse;
import com.umbrella_api.common.security.CustomUserDetails;
import com.umbrella_api.modules.FileDb.dto.FileUploadResponse;
import com.umbrella_api.modules.storage.api.StorageService;
import com.umbrella_api.modules.storage.common.StorageFileEntity;

import com.umbrella_api.modules.storage.dto.ImageResponseDto;
import com.umbrella_api.modules.storage.dto.RawFileResponseDto;
import com.umbrella_api.modules.storage.dto.VideoResponseDto;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/logged/storage")
public class StorageController {

    private final StorageService storageService;
    private final com.umbrella_api.modules.storage.infra.SubtitleGenerationService subtitleService;

    StorageController(StorageService storageService,
            com.umbrella_api.modules.storage.infra.SubtitleGenerationService subtitleService) {
        this.storageService = storageService;
        this.subtitleService = subtitleService;
    }

    @PostMapping("/upload")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<FileUploadResponse> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("resourceType") String resourceType,
            @RequestParam(value = "alternativeText", required = false) String alternativeText,
            @RequestParam("fileName") String fileName,
            @RequestParam(value = "fileDescription", required = false) String fileDescription,
            @RequestParam(value = "moduleId", required = false) Long moduleId,
            @AuthenticationPrincipal CustomUserDetails loggedUser) {

        FileUploadResponse response = storageService.upload(
                file,
                resourceType,
                alternativeText,
                fileName,
                fileDescription,
                moduleId,
                loggedUser);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/image/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ImageResponseDto> getImageById(@PathVariable long id) {
        return ResponseEntity.ok(storageService.getImageById(id));

    }

    @GetMapping("/video/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<VideoResponseDto> getVideoById(@PathVariable long id) {
        return ResponseEntity.ok(storageService.getVideoById(id));

    }

    /**
     * Lists the materials (files) attached to a module. The app's course and
     * recorded-lessons screens consume this to show a module's videos/files;
     * previously the service method existed but was never exposed over REST,
     * so the app's GET for module materials always 404'd and fell back to an
     * empty list (videos never appeared after upload).
     */
    @GetMapping("/module/{moduleId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<java.util.List<com.umbrella_api.modules.storage.dto.FileMetaDataResponseDto>> getFilesByModule(
            @PathVariable Long moduleId) {
        return ResponseEntity.ok(storageService.getFilesByModuleId(moduleId));
    }

    // ── Legendas (normal + Libras) de um vídeo ───────────────────────────────

    /** Vídeo + suas duas legendas e estados (consumido pelo player do app). */
    @GetMapping("/video/{id}/subtitles")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<com.umbrella_api.modules.storage.dto.VideoWithSubtitlesDto> getSubtitles(
            @PathVariable Long id) {
        return ResponseEntity.ok(subtitleService.getVideoWithSubtitles(id));
    }

    /** Redispara a geração automática das legendas do vídeo. */
    @PostMapping("/video/{id}/subtitles/regenerate")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<GenericResponse> regenerateSubtitles(@PathVariable Long id) {
        subtitleService.generateForVideo(id);
        return ResponseEntity.ok(new GenericResponse("ok", "Geração de legendas disparada", 200));
    }

    /**
     * Fallback manual: envia os dois SRTs (normal e libras) já prontos,
     * para quando o worker de geração estiver indisponível.
     */
    @PostMapping("/video/{id}/subtitles")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<GenericResponse> uploadSubtitles(
            @PathVariable Long id,
            @RequestParam("normal") String normalSrt,
            @RequestParam("libras") String librasSrt) {
        subtitleService.saveManual(id, com.umbrella_api.modules.storage.model.SubtitleKind.NORMAL, normalSrt);
        subtitleService.saveManual(id, com.umbrella_api.modules.storage.model.SubtitleKind.LIBRAS, librasSrt);
        return ResponseEntity.ok(new GenericResponse("ok", "Legendas salvas", 200));
    }

    @GetMapping("/raw/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RawFileResponseDto> getRawById(@PathVariable long id) {
        return ResponseEntity.ok(storageService.getRawFileById(id));
    }

    @DeleteMapping("/{resourceType}/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<GenericResponse> deleteFile(
            @PathVariable String resourceType,
            @PathVariable Long id) {

        StorageFileEntity file = storageService.findEntityByTypeAndId(resourceType, id);

        if (file == null) {
            return ResponseEntity.status(404)
                    .body(new GenericResponse("Error", "File not found", 404));
        }

        GenericResponse response = storageService.delete(file);

        return ResponseEntity.ok(response);

    }

    /**
     * Deletes a module material by its FileMetaData id (the id the materials
     * listing exposes), removing the file from the DB and Cloudinary.
     */
    @DeleteMapping("/material/{metaId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<GenericResponse> deleteMaterial(@PathVariable Long metaId) {
        Long moduleId = storageService.deleteFileByMetaId(metaId);

        if (moduleId == null) {
            return ResponseEntity.status(404)
                    .body(new GenericResponse("Error", "Material not found", 404));
        }

        return ResponseEntity.ok(new GenericResponse("ok", "Success on delete material", 200));
    }
}