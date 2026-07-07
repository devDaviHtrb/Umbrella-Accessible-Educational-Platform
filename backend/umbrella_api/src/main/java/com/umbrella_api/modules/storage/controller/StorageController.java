package com.umbrella_api.modules.storage.controller;

import com.umbrella_api.common.dto.GenericResponse;
import com.umbrella_api.common.security.CustomUserDetails;
import com.umbrella_api.modules.storage.api.StorageService;
import com.umbrella_api.modules.storage.common.StorageFileEntity;
import com.umbrella_api.modules.storage.dto.ImageResponseDto;
import com.umbrella_api.modules.storage.dto.RawFileResponseDto;
import com.umbrella_api.modules.storage.dto.VideoResponseDto;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/public/storage")
public class StorageController {

    private final StorageService storageService;

    StorageController(StorageService storageService) {
        this.storageService = storageService;
    }

    @PostMapping("/upload")
    public ResponseEntity<GenericResponse> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("resourceType") String resourceType,
            @RequestParam(value = "alternativeText", required = false) String alternativeText,
            @RequestParam("fileName") String fileName,
            @RequestParam(value = "fileDescription", required = false) String fileDescription,
            @RequestParam(value = "moduleId", required = false) Long moduleId,
            @AuthenticationPrincipal CustomUserDetails loggedUser) {

        GenericResponse response = storageService.upload(
                file,
                resourceType,
                alternativeText,
                fileName,
                fileDescription,
                moduleId,
                loggedUser);

        if (response.status().equalsIgnoreCase("Error")) {
            return ResponseEntity.status(400).body(response);
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/image/{id}")
    public ResponseEntity<ImageResponseDto> getImageById(@PathVariable long id) {
        return ResponseEntity.ok(storageService.getImageById(id));

    }

    @GetMapping("/video/{id}")
    public ResponseEntity<VideoResponseDto> getVideoById(@PathVariable long id) {
        return ResponseEntity.ok(storageService.getVideoById(id));

    }

    @GetMapping("/raw/{id}")
    public ResponseEntity<RawFileResponseDto> getRawById(@PathVariable long id) {
        return ResponseEntity.ok(storageService.getRawFileById(id));
    }

    @DeleteMapping("/{resourceType}/{id}")
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
}