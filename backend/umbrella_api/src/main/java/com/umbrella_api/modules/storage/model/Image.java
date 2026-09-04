package com.umbrella_api.modules.storage.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.umbrella_api.modules.FileDb.dto.FileUploadResponse;
import com.umbrella_api.modules.storage.common.BaseFileEntity;
import com.umbrella_api.modules.user.model.UserModel;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "images")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class Image extends BaseFileEntity {

    @Column
    private Integer width;

    @Column
    private Integer height;

    @Column(name = "image_type")
    private String type;

    @Column(nullable = false, length = 500)
    private String alternativeText;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = true)
    private UserModel user;

    @OneToOne(mappedBy = "image")
    @JsonManagedReference
    private FileMetaData fileMetaData;

    @Override
    public String getResourceType() {
        return "image";
        // image: .jpg, .png, .gif and .pdf
    }

    @Override
    public void setFile(FileMetaData file) {
        this.fileMetaData = file;
    }

    public static Image create(FileUploadResponse data, FileMetaData meta, String altText) {
        return Image.builder()
                .fileDbId(data.publicId())
                .url(data.url())
                .alternativeText(altText != null ? altText : "Without description")
                .width(data.width())
                .height(data.height())
                .fileMetaData(meta)
                .build();
    }
}
