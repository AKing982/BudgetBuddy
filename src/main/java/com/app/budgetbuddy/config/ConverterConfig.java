package com.app.budgetbuddy.config;

import com.app.budgetbuddy.workbench.converter.AccountBaseConverter;
import com.app.budgetbuddy.workbench.converter.TransactionDTOConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ConverterConfig
{
    @Bean
    public TransactionDTOConverter transactionDTOConverter(){
        return new TransactionDTOConverter();
    }

    @Bean
    public AccountBaseConverter accountBaseConverter(){
        return new AccountBaseConverter();
    }
}