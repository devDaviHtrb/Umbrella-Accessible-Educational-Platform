package com.umbrella_api.modules.storage.model;

import com.umbrella_api.modules.storage.common.BaseFileEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "videos")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor  // Exigido pelo Hibernate
@AllArgsConstructor // Exigido pelo @SuperBuilder
public class Videos extends BaseFileEntity {

    @Column(nullable = false)
    private Double duration;

    @OneToOne(mappedBy = "videos")
    private FileMetaData fileMetaData;

    @Override
    public String getResourceType() {
        return "videos";
    }

    @Override
    public void setFile(FileMetaData file) {
        this.fileMetaData = file;
    }
}
