package com.umbrella_api.modules.storage.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.SuperBuilder;

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
@Table(name = "RAW")
@SuperBuilder
public class RawFile extends BaseFile {

    @Override
    public String getResourceType() {
        return "raw";
    }
}
