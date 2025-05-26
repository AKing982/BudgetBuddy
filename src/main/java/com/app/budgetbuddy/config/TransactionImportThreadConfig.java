package com.app.budgetbuddy.config;

import lombok.Setter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDate;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Configuration
@Setter
public class TransactionImportThreadConfig
{
    // Number of default weekly worker threads for a month
    private final int NUM_OF_WEEKLY_THREADS_DEFAULT = 4;
    private final int NUM_OF_MONTHLY_THREADS_DEFAULT = 12;
    private int numOfMonthsFromCurrentDate;
    private final int currentYear = LocalDate.now().getYear();
    private final LocalDate budgetYearStart = LocalDate.of(currentYear, 1, 1);

    @Bean(name="monthlyExecutor")
    public ExecutorService monthlyExecutorService()
    {
        LocalDate currentDate = LocalDate.now();
        int numOfMonthsFromCurrentDate = currentDate.getMonthValue() - budgetYearStart.getMonthValue();
        return Executors.newFixedThreadPool(numOfMonthsFromCurrentDate);
    }
}
