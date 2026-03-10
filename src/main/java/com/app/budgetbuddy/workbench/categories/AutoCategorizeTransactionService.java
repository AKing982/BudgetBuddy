package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.CategoryException;
import com.app.budgetbuddy.services.CSVTransactionService;
import com.app.budgetbuddy.services.TransactionRuleService;
import com.app.budgetbuddy.services.TransactionService;
import com.app.budgetbuddy.services.UserCategoryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class AutoCategorizeTransactionService
{
    private final CSVTransactionService csvTransactionService;
    private final TransactionService transactionService;
    private final CSVTransactionCategorizationEngine csvCategorizerService;
    private final String USER_CATEGORIZED = "USER";

    @Autowired
    public AutoCategorizeTransactionService(@Qualifier("csvCategorizer") CSVTransactionCategorizationEngine csvCategorizerService,
                                            TransactionService transactionService,
                                            CSVTransactionService csvTransactionService)
    {
        this.csvCategorizerService = csvCategorizerService;
        this.csvTransactionService = csvTransactionService;
        this.transactionService = transactionService;
    }


}
