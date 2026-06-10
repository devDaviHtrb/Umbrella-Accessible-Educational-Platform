package com.umbrella_api.modules.storage.common;

import jakarta.persistence.Column;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@MappedSuperclass
@Getter
@Setter
@SuperBuilder
public abstract class BaseFileEntity implements StorageFileEntity {
    @Id
    private long id;

    @Column(nullable = false)
    String url;

    @Column(nullable = false)
    String fileDbId;

}
