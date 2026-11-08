package com.umbrella_api.modules.FileDb.config;

import java.util.Map;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.cloudinary.Cloudinary;

@Configuration
public class CloudinaryConfig {
    @Bean
    public static Cloudinary create(CloudinaryData params) {
        Map<String, Object> configBody = Map.of(
                "cloud_name", params.cloudName(),
                "api_key", params.apiKey(),
                "api_secret", params.apiSecret(),
                "secure", true);

        return new Cloudinary(configBody);
    }
}
