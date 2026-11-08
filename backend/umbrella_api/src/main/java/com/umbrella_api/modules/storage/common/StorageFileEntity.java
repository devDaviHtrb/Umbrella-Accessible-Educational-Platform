package com.umbrella_api.modules.storage.common;

import com.umbrella_api.modules.storage.model.FileMetaData;

public interface StorageFileEntity {
    public String getFileDbId();

    public String getResourceType();

    public String getUrl();

    public void setFile(FileMetaData file);

}
