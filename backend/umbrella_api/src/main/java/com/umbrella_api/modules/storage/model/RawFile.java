package com.umbrella_api.modules.storage.model;

import com.umbrella_api.modules.storage.common.BaseFileEntity;

import jakarta.persistence.Entity;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.SuperBuilder;

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
@Table(name = "raws")
@SuperBuilder
public class RawFile extends BaseFileEntity {

    @OneToOne(mappedBy = "rawFile")
    private FileMetaData fileMetaData;

    @Override
    public String getResourceType() {
        return "raw";
    }

    @Override
    public void setFile(FileMetaData file) {
        this.fileMetaData = file;
    }

}
