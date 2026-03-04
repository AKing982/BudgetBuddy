package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.Category;
import com.app.budgetbuddy.entities.SystemCategoryRulesEntity;
import com.app.budgetbuddy.services.CategoryService;
import com.app.budgetbuddy.services.SystemCategoryRulesService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Optional;

@Component
@Slf4j
public class MACUCategorizationStrategy implements CSVCategorizationStrategy
{
    private final SystemCategoryRulesService systemCategoryRulesService;
    private final CategoryService categoryService;
    private final String SYSTEM_CATEGORIZED = "SYSTEM";

    @Autowired
    public MACUCategorizationStrategy(SystemCategoryRulesService systemCategoryRulesService,
                                      CategoryService categoryService)
    {
        this.systemCategoryRulesService = systemCategoryRulesService;
        this.categoryService = categoryService;
    }

    @Override
    public boolean supports(String institutionId)
    {
        return "Mountain America Credit Union".equals(institutionId);
    }

    @Override
    public Category categorize(String merchantNameUpper, String transactionCategory,
                               double absAmount)
    {
        // Level 0: merchant + category + amount
        Optional<SystemCategoryRulesEntity> rule = systemCategoryRulesService
                .findByMerchantCategoryAndAmount(merchantNameUpper, transactionCategory, absAmount);
        if(rule.isPresent())
        {
            log.info("MACU - Matched MerchantCategoryAmount: merchant={}, category={}, amount={}",
                    merchantNameUpper, transactionCategory, absAmount);
            return buildCategory(rule.get(), categoryService);
        }

        // Level 1: merchant + category
        if(transactionCategory != null && !transactionCategory.isEmpty())
        {
            rule = systemCategoryRulesService.findByMerchantAndCategory(merchantNameUpper, transactionCategory);
            if(rule.isPresent())
            {
                log.info("MACU - Matched MerchantCategory: merchant={}, category={}",
                        merchantNameUpper, transactionCategory);
                return buildCategory(rule.get(), categoryService);
            }

            rule = systemCategoryRulesService.findByCategoryOnly(transactionCategory);
            if(rule.isPresent())
            {
                log.info("MACU - Matched CategoryOnly: category={}", transactionCategory);
                return buildCategory(rule.get(), categoryService);
            }
        }

        log.warn("MACU - No rule matched: merchant={}, category={}, amount={}",
                merchantNameUpper, transactionCategory, absAmount);
        return Category.createUncategorized();
    }

    private Category buildCategory(SystemCategoryRulesEntity rule, CategoryService categoryService)
    {
        String matchedCategoryName = rule.getMatchedCategory();
        Long categoryId = categoryService.getCategoryIdByName(matchedCategoryName);
        return Category.createCategory(categoryId, matchedCategoryName, SYSTEM_CATEGORIZED, LocalDate.now());
    }
}
