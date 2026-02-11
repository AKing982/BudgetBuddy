package com.app.budgetbuddy.config;

import com.app.budgetbuddy.domain.DateRange;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;

import java.time.LocalDate;
import java.util.concurrent.*;

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
    private int currentYear = LocalDate.now().getYear();
    private final LocalDate budgetBeginDate = LocalDate.of(currentYear, 1, 1);
    private int numOfMonthsSinceCurrentDate = LocalDate.now().getMonthValue() - budgetBeginDate.getMonthValue();

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

    @Bean(name="monthlyExecutor")
    public ThreadPoolExecutor monthlyThreadPoolExecutor(){
        // Limit concurrent Plaid requests to stay under rate limits
        int poolSize = 4; // Conservative for API rate limits

        return new ThreadPoolExecutor(
                2,     // core pool
                poolSize, // max - keep low for API limits
                60L, TimeUnit.SECONDS,
                new LinkedBlockingQueue<>(50),
                new ThreadPoolExecutor.CallerRunsPolicy()
        );
    }

    @Bean
    public ScheduledExecutorService scheduledExecutorService(){
        return Executors.newScheduledThreadPool(corePoolSize);
    }
}
