package com.app.budgetbuddy.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@Configuration
@EnableAsync
public class AsyncConfig
{
    @Bean(name = "taskExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);   // Reduced for Plaid rate limits
        executor.setMaxPoolSize(4);    // Conservative for API limits
        executor.setQueueCapacity(100); // Smaller queue
        executor.setThreadNamePrefix("PlaidAPI-");
        executor.initialize();
        return executor;
    }
}
