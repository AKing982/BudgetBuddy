package com.app.budgetbuddy.config;

import com.plaid.client.ApiClient;
import com.plaid.client.request.PlaidApi;
import okhttp3.OkHttpClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class PlaidConfig
{
//    @Value("${plaid.url}")
//    private String plaidUrl;
//
//    @Value("${plaid.client-id}")
//    private String plaidClientId;
//
//    @Value("${plaid.secret}")
//    private String plaidSecret;

    @Bean(name="plaid")
    public PlaidApi plaidApi(){
        OkHttpClient.Builder httpClient = new OkHttpClient.Builder();
        httpClient.addInterceptor(chain -> {
            okhttp3.Request original = chain.request();
            okhttp3.Request request = original.newBuilder()
                    .header("PLAID-CLIENT-ID", "65751d03302cc7001c6c8ea4")
                    .header("PLAID-SECRET", "be9f20b15e0f391d2cb76d088e6ad6")
                    .method(original.method(), original.body())
                    .build();
            return chain.proceed(request);
        });

        ApiClient apiClient = new ApiClient();
        apiClient.setPlaidAdapter("https://sandbox.plaid.com");
        apiClient.configureFromOkclient(httpClient.build());

        return apiClient.createService(PlaidApi.class);
    }
}
