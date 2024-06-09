package com.example.plaidservice.config;

import com.plaid.client.ApiClient;
import com.plaid.client.request.PlaidApi;
import lombok.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class PlaidConfig {

    @Value("${plaid.environment}")
    private String environment;

    @Bean
    public PlaidApi plaidClient(){
        ApiClient apiClient = new ApiClient();
        apiClient.setPlaidAdapter(environment);
        switch (environment.toLowerCase()) {
            case "sandbox":
                apiClient.setPlaidAdapter(ApiClient.Sandbox);
                break;
            case "development":
                apiClient.setPlaidAdapter(ApiClient.Development);
                break;
            case "production":
                apiClient.setPlaidAdapter(ApiClient.Production);
                break;
            default:
                throw new IllegalArgumentException("Invalid Plaid environment: " + environment);
        }

        return apiClient.createService(PlaidApi.class);
    }
}
