package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.CategoryService;
import com.app.budgetbuddy.services.UserCategoryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Slf4j
public class TransactionCategoryStrategy implements TransactionCategoryBuilderStrategy<Transaction>
{
    private final CategorizationEngine<Transaction> categorizerService;
    private final CategoryService categoryService;
    private final UserCategoryService userCategoryService;

    @Autowired
    public TransactionCategoryStrategy(@Qualifier("transactionCategorizer")CategorizationEngine<Transaction> transactionCategorizer,
                                       CategoryService categoryService,
                                       UserCategoryService userCategoryService)
    {
        this.categorizerService = transactionCategorizer;
        this.categoryService = categoryService;
        this.userCategoryService = userCategoryService;
    }

    @Override
    public boolean supports(Object transactionType)
    {
        return transactionType instanceof Transaction;
    }

    @Override
    public List<TransactionCategory> build(List<Transaction> transactions, List<SubBudget> subBudgets)
    {
        List<TransactionCategory> transactionCategories = transactions.stream()
                .map(transaction -> {
                    String transactionId = transaction.getTransactionId();
                    LocalDate posted = transaction.getPosted();
                    Category category = categorizerService.categorize(transaction);
                    String categoryName = category.getCategoryName();
                    SubBudget subBudget = getMatchingSubBudget(subBudgets, posted);
                    String categoryType = categoryService.getCategoryType(categoryName);
                    CategoryExpenseType categoryExpenseType = CategoryExpenseType.fromString(categoryType);
                    int bucketLevel = categoryService.getCategoryBucketLevel(categoryName);
                    CategoryPriorityLevel categoryPriorityLevel = CategoryPriorityLevel.findByOrder(bucketLevel);
                    return TransactionCategory.builder()
                            .category(categoryName)
                            .subBudgetId(subBudget.getId())
                            .transactionId(transactionId)
                            .categorizedDate(category.getCategorizedDate())
                            .createdAt(LocalDateTime.now())
                            .categorizedBy(category.getCategorizedBy())
                            .isUpdated(false)
                            .categoryExpenseType(categoryExpenseType)
                            .categoryPriorityLevel(categoryPriorityLevel)
                            .build();
                })
                .toList();
        log.info("Transaction Categories: {}", transactionCategories);
        return transactionCategories;
    }

    @Override
    public List<TransactionCategory> reCategorize(List<TransactionCategory> transactionCategories, List<Transaction> transactions, List<SubBudget> subBudgets)
    {
        Map<String, TransactionCategory> existingById = transactionCategories.stream()
                .collect(Collectors.toMap(TransactionCategory::getTransactionId, Function.identity()));
        return transactions.stream()
                .map(transaction -> {
                    TransactionCategory existing = existingById.get(transaction.getTransactionId());
                    if(existing == null)
                    {
                        return null;
                    }
                    Category category = categorizerService.categorize(transaction);
                    String categoryName = category.getCategoryName();
                    SubBudget matchingSubBudget = getMatchingSubBudget(subBudgets, transaction.getPosted());
                    String categoryType = categoryService.getCategoryType(categoryName);
                    CategoryExpenseType categoryExpenseType = CategoryExpenseType.fromString(categoryType);
                    int bucketLevel = categoryService.getCategoryBucketLevel(categoryName);
                    CategoryPriorityLevel categoryPriorityLevel = CategoryPriorityLevel.findByOrder(bucketLevel);
                    existing.setCategory(categoryName);
                    existing.setCategorizedBy(category.getCategorizedBy());
                    existing.setCategorizedDate(category.getCategorizedDate());
                    existing.setCategoryExpenseType(categoryExpenseType);
                    existing.setCategoryPriorityLevel(categoryPriorityLevel);
                    existing.setSubBudgetId(matchingSubBudget.getId());
                    existing.setUpdated(true);
                    return existing;
                })
                .toList();
    }

    private SubBudget getMatchingSubBudget(List<SubBudget> subBudgets, LocalDate posted)
    {
        return subBudgets.stream()
                .filter(sb -> !posted.isBefore(sb.getStartDate()) && !posted.isAfter(sb.getEndDate()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("No matching sub-budget found for posted date: " + posted));
    }
}
