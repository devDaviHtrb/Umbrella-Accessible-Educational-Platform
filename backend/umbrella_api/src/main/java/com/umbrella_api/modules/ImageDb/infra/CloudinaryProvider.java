package com.umbrella_api.modules.ImageDb.infra;

import java.util.Map;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.cloudinary.Cloudinary;
import com.umbrella_api.modules.ImageDb.config.CloudinaryConfig;

@Configuration
public class CloudinaryProvider {

    @Bean
    public static Cloudinary create(CloudinaryConfig params) {
        Map<String, Object> configBody = Map.of(
                "cloud_name", params.cloudName(),
                "api_key", params.apiKey(),
                "api_secret", params.apiSecret(),
                "secure", true);

        return new Cloudinary(configBody);
    }

}
