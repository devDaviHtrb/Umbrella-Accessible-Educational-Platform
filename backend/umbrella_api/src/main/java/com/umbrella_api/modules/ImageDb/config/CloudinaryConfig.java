package com.umbrella_api.modules.ImageDb.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import com.cloudinary.Cloudinary;

@ConfigurationProperties(prefix = "cloudinary")
public record CloudinaryConfig(
        String cloudName,
        String apiKey,
        String apiSecret) {

}
