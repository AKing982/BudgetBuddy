package com.app.budgetbuddy.config;

import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;

@Configuration
@EnableAsync
@EnableScheduling
@Slf4j
public class ThreadConfig
{
    private int corePoolSize = Runtime.getRuntime().availableProcessors();
    private int maxPoolSize = corePoolSize * 2;
    private int keepAliveSeconds = 60;
    private int queueCapacity = 1000;
    private String threadNamePrefix = "TheadPool-";

    @Bean(name="taskExecutor2")
    public ThreadPoolTaskExecutor threadPoolTaskExecutor(){
        ThreadPoolTaskExecutor threadPoolTaskExecutor = new ThreadPoolTaskExecutor();
        threadPoolTaskExecutor.setCorePoolSize(corePoolSize);
        threadPoolTaskExecutor.setMaxPoolSize(maxPoolSize);
        threadPoolTaskExecutor.setKeepAliveSeconds(keepAliveSeconds);
        threadPoolTaskExecutor.setQueueCapacity(queueCapacity);
        threadPoolTaskExecutor.setThreadNamePrefix(threadNamePrefix);
        threadPoolTaskExecutor.initialize();
        return threadPoolTaskExecutor;
    }

    @Bean(name="taskScheduler1")
    public ThreadPoolTaskScheduler threadPoolTaskScheduler(){
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(5); // Or however many threads you want
        scheduler.setThreadNamePrefix("TransactionSync-");
        scheduler.initialize();
        return scheduler;
    }



    @Bean
    public ScheduledExecutorService scheduledExecutorService(){
        return Executors.newScheduledThreadPool(corePoolSize);
    }
}
