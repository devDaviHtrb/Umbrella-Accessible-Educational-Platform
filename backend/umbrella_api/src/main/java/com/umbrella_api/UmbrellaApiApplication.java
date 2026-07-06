package com.umbrella_api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@ConfigurationPropertiesScan
@SpringBootApplication
public class UmbrellaApiApplication {

	public static void main(String[] args) {

		SpringApplication.run(UmbrellaApiApplication.class, args);
	}

}
