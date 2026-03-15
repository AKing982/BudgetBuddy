package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.Category;
import com.app.budgetbuddy.domain.CategoryType;
import com.app.budgetbuddy.entities.PlaidCategoriesEntity;
import com.app.budgetbuddy.entities.SystemCategoryRulesEntity;
import com.app.budgetbuddy.services.PlaidCategoriesService;
import com.app.budgetbuddy.services.SystemCategoryRulesService;
import com.app.budgetbuddy.workbench.MerchantMatcherService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Optional;

@Component
@Slf4j
public class PlaidCategorizationStrategy
{
    private final PlaidCategoriesService plaidCategoriesService;
    private final MerchantMatcherService merchantMatcherService;
    private final String SYSTEM_CATEGORIZED = "SYSTEM";

    @Autowired
    public PlaidCategorizationStrategy(MerchantMatcherService merchantMatcherService,
                                       PlaidCategoriesService plaidCategoriesService)
    {
        this.merchantMatcherService = merchantMatcherService;
        this.plaidCategoriesService = plaidCategoriesService;
    }

    public Category categorize(String categoryId, String primary, String secondary, String merchantName, int priority)
    {
        Optional<PlaidCategoriesEntity> rule;
        Category matchedCategory;
        log.info("Priority: {}", priority);
        return switch (priority) {
            case 1 -> {
                rule = plaidCategoriesService.findByPlaidFull(categoryId, primary, secondary);
                matchedCategory = buildMatchedCategory(rule);
                yield matchedCategory;
            }
            case 2 -> {
                rule = plaidCategoriesService.findByPlaidPrimaryAndSecondary(primary, secondary);
                matchedCategory = buildMatchedCategory(rule);
                yield matchedCategory;
            }
            case 5 -> {
                rule = plaidCategoriesService.findByPlaidCategoryIdAndSecondary(categoryId, secondary);
                matchedCategory = buildMatchedCategory(rule);
                yield matchedCategory;
            }
            case 6 -> {
                rule = plaidCategoriesService.findByPlaidCategoryIdAndPrimary(categoryId, primary);
                matchedCategory = buildMatchedCategory(rule);
                yield matchedCategory;
            }
            case 7 -> {
                rule = plaidCategoriesService.findByPlaidPrimaryOnly(primary);
                matchedCategory = buildMatchedCategory(rule);
                yield matchedCategory;
            }
            case 8 -> {
                rule = plaidCategoriesService.findByPlaidSecondaryOnly(secondary);
                matchedCategory = buildMatchedCategory(rule);
                yield matchedCategory;
            }
            case 9 -> {
                rule = plaidCategoriesService.findByPlaidCategoryIdOnly(categoryId);
                matchedCategory = buildMatchedCategory(rule);
                yield matchedCategory;
            }
            case 10 -> {
                Optional<CategoryType> categoryType = merchantMatcherService.matchMerchant(merchantName);
                yield Category.builder()
                        .categorizedBy(SYSTEM_CATEGORIZED)
                        .plaidCategoryId("")
                        .categorizedDate(LocalDate.now())
                        .categoryName(categoryType.get().getType())
                        .build();
            }
            default -> {
                log.warn("Plaid - No rule matched: categoryId={}, primary={}, secondary={}, merchant={}",
                        categoryId, primary, secondary, merchantName);
                yield Category.createUncategorized();
            }
        };
    }

    private Category buildMatchedCategory(Optional<PlaidCategoriesEntity> rule)
    {
        return rule.isPresent() ? buildCategory(rule.get()) : Category.createUncategorized();
    }

    private Category buildCategory(PlaidCategoriesEntity rule)
    {
        return Category.builder()
                .categorizedBy(SYSTEM_CATEGORIZED)
                .plaidCategoryId("")
                .categorizedDate(LocalDate.now())
                .categoryName(rule.getMatchedCategory())
                .build();
    }
}
