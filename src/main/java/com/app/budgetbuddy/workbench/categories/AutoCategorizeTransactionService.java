package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.CategoryType;
import com.app.budgetbuddy.domain.PriorityLevel;
import com.app.budgetbuddy.domain.TransactionRule;
import com.app.budgetbuddy.services.CategoryService;
import com.app.budgetbuddy.services.TransactionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class AutoCategorizeTransactionService
{
    private final TransactionRuleService transactionRuleService;

    @Autowired
    public AutoCategorizeTransactionService(TransactionRuleService transactionRuleService)
    {
        this.transactionRuleService = transactionRuleService;
    }
}
