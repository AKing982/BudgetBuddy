package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.workbench.categories.CategoryRuleEngine;
import org.hibernate.annotations.SecondaryRow;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;

@Service
public class CategoryRuleRunner
{
    private CategoryRuleEngine categoryRuleEngine;
    private ThreadPoolTaskExecutor taskExecutor;

    @Autowired
    public CategoryRuleRunner(CategoryRuleEngine categoryRuleEngine,
                              @Qualifier("taskExecutor") ThreadPoolTaskExecutor taskExecutor)
    {
        this.categoryRuleEngine = categoryRuleEngine;
    }

    public static void main(String[] args){

    }

    public void categorizeOnNewTransactions(Long userId){

    }

    public void categorizeOnLogin(Long userId){

    }


}
