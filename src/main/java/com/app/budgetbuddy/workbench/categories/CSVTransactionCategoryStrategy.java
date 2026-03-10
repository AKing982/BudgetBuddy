package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.CategoryService;
import com.app.budgetbuddy.services.UserCategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class CSVTransactionCategoryStrategy implements TransactionCategoryBuilderStrategy<TransactionCSV>
{
    private final CategorizationEngine<TransactionCSV> csvCategorizerService;
    private final CategoryService categoryService;
    private final UserCategoryService userCategoryService;

    @Autowired
    public CSVTransactionCategoryStrategy(@Qualifier("csvCategorizer") CategorizationEngine<TransactionCSV> csvCategorizerService,
                                          CategoryService categoryService,
                                          UserCategoryService userCategoryService)
    {
        this.csvCategorizerService = csvCategorizerService;
        this.categoryService = categoryService;
        this.userCategoryService = userCategoryService;
    }

    @Override
    public boolean supports(Object transactionType)
    {
        return transactionType instanceof TransactionCSV;
    }

    @Override
    public List<TransactionCategory> build(List<TransactionCSV> transactions, List<SubBudget> subBudgets)
    {
        return transactions.stream()
                .map(transactionCSV -> {
                    Long csvId = transactionCSV.getId();
                    LocalDate transactionDate = transactionCSV.getTransactionDate();
                    Category category = csvCategorizerService.categorize(transactionCSV);
                    String categoryName = category.getCategoryName();
                    SubBudget matchedSubBudget = getMatchingSubBudget(subBudgets, transactionDate);
                    Long subBudgetId = matchedSubBudget.getId();
                    String categoryType = categoryService.getCategoryType(categoryName);
                    CategoryExpenseType categoryExpenseType = CategoryExpenseType.fromString(categoryType);
                    int bucketLevel = categoryService.getCategoryBucketLevel(categoryName);
                    CategoryPriorityLevel categoryPriorityLevel = CategoryPriorityLevel.findByOrder(bucketLevel);
                    return TransactionCategory.builder()
                            .category(categoryName)
                            .subBudgetId(subBudgetId)
                            .csvTransactionId(csvId)
                            .categorizedDate(category.getCategorizedDate())
                            .createdAt(LocalDateTime.now())
                            .categorizedBy(category.getCategorizedBy())
                            .isUpdated(false)
                            .categoryExpenseType(categoryExpenseType)
                            .categoryPriorityLevel(categoryPriorityLevel)
                            .build();
                })
                .toList();

    }

    @Override
    public List<TransactionCategory> reCategorize(List<TransactionCategory> transactionCategories, List<TransactionCSV> transactions, List<SubBudget> subBudgets)
    {

        Map<Long, TransactionCategory> existingById = transactionCategories.stream()
                .collect(Collectors.toMap(TransactionCategory::getCsvTransactionId, Function.identity()));
        return transactions.stream()
                .map(csv -> {
                    TransactionCategory existing = existingById.get(csv.getId());
                    if (existing == null) return null;

                    Category category = csvCategorizerService.categorize(csv);
                    String categoryName = category.getCategoryName();
                    SubBudget matchedSubBudget = getMatchingSubBudget(subBudgets, csv.getTransactionDate());
                    String categoryType = categoryService.getCategoryType(categoryName);
                    CategoryExpenseType categoryExpenseType = CategoryExpenseType.fromString(categoryType);
                    int bucketLevel = categoryService.getCategoryBucketLevel(categoryName);
                    CategoryPriorityLevel categoryPriorityLevel = CategoryPriorityLevel.findByOrder(bucketLevel);

                    existing.setCategory(categoryName);
                    existing.setCategorizedBy(category.getCategorizedBy());
                    existing.setCategorizedDate(category.getCategorizedDate());
                    existing.setSubBudgetId(matchedSubBudget.getId());
                    existing.setCategoryExpenseType(categoryExpenseType);
                    existing.setCategoryPriorityLevel(categoryPriorityLevel);
                    existing.setUpdated(true);
                    return existing;
                })
                .filter(Objects::nonNull)
                .toList();
    }

    private SubBudget getMatchingSubBudget(List<SubBudget> subBudgets, LocalDate transactionDate)
    {
        return subBudgets.stream()
                .filter(sb -> !transactionDate.isBefore(sb.getStartDate()) && !transactionDate.isAfter(sb.getEndDate()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Sub-budget not found"));
    }
}
