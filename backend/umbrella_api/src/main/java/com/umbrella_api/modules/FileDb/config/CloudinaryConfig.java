package com.umbrella_api.modules.FileDb.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "cloudinary")
public record CloudinaryConfig(
        String cloudName,
        String apiKey,
        String apiSecret) {

}
