package com.app.budgetbuddy.config;

import com.app.budgetbuddy.workbench.categories.TransactionCategoryBuilder;
import org.mockito.Mockito;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;

@Profile("test")
@Configuration
public class TransactionCategoryBuilderMockConfig
{
    @Bean
    @Primary
    public TransactionCategoryBuilder transactionCategoryBuilder()
    {
        return Mockito.mock(TransactionCategoryBuilder.class);
    }

}
