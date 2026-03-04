package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.Category;
import com.app.budgetbuddy.domain.CategoryType;
import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.domain.TransactionCSV;
import com.app.budgetbuddy.services.TransactionRuleService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@Slf4j
public class AutoCategorizeTransactionService
{
    private final TransactionRuleService transactionRuleService;
    private final TransactionCategorizationEngine categorizer;
    private final CSVTransactionCategorizationEngine csvCategorizer;

    @Autowired
    public AutoCategorizeTransactionService(TransactionRuleService transactionRuleService,
                                            @Qualifier("csvCategorizer") CSVTransactionCategorizationEngine csvCategorizer,
                                            @Qualifier("transactionCategorizer") TransactionCategorizationEngine categorizer)
    {
        this.transactionRuleService = transactionRuleService;
        this.categorizer = categorizer;
        this.csvCategorizer = csvCategorizer;
    }

    public List<TransactionCSV> fetchUncategorizedCSVTransactionsByUser(Long userId,
                                                                        LocalDate startDate,
                                                                        LocalDate endDate)
    {
        return null;
    }

    public List<Transaction> fetchUncategorizedTransactionsByUser(Long userId,
                                                                  LocalDate startDate,
                                                                  LocalDate endDate)
    {
        return null;
    }

    public Category recategorizeCSVTransaction(TransactionCSV transaction)
    {
        return csvCategorizer.categorize(transaction);
    }

    public Category recategorizeTransaction(Transaction transaction)
    {
        return categorizer.categorize(transaction);
    }

}
