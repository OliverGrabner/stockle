package com.stockle.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        String frontendUrl = System.getenv("FRONTEND_URL");
        registry.addMapping("/api/**")
            .allowedOrigins(
                frontendUrl != null ? frontendUrl : "https://stockle-xi.vercel.app",
                "https://stockle-xi.vercel.app",
                "http://localhost:3000"
            )
            .allowedMethods("GET", "POST", "PUT", "DELETE");
    }
}
