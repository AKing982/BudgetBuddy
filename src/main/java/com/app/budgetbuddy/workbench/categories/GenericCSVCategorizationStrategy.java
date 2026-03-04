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
public class GenericCSVCategorizationStrategy implements CSVCategorizationStrategy
{
    private final SystemCategoryRulesService systemCategoryRulesService;
    private final CategoryService categoryService;
    private final String SYSTEM_CATEGORIZED = "SYSTEM";

    @Autowired
    public GenericCSVCategorizationStrategy(SystemCategoryRulesService systemCategoryRulesService,
                                            CategoryService categoryService)
    {
        this.systemCategoryRulesService = systemCategoryRulesService;
        this.categoryService = categoryService;
    }

    @Override
    public boolean supports(String institution)
    {
        return true;
    }

    @Override
    public Category categorize(String merchantNameUpper, String transactionCategory, double absAmount)
    {
        // Level 0: merchant + amount
        Optional<SystemCategoryRulesEntity> rule = systemCategoryRulesService
                .findByMerchantAndAmount(merchantNameUpper, absAmount);
        if(rule.isPresent())
        {
            log.info("Generic - Matched MerchantAmount: merchant={}, amount={}", merchantNameUpper, absAmount);
            return buildCategory(rule.get(), categoryService);
        }

        // Level 1: merchant only
        rule = systemCategoryRulesService.findByMerchantOnly(merchantNameUpper);
        if(rule.isPresent())
        {
            log.info("Generic - Matched MerchantOnly: merchant={}", merchantNameUpper);
            return buildCategory(rule.get(), categoryService);
        }

        log.warn("Generic - No rule matched: merchant={}, amount={}", merchantNameUpper, absAmount);
        return Category.createUncategorized();
    }

    private Category buildCategory(SystemCategoryRulesEntity rule, CategoryService categoryService)
    {
        String matchedCategoryName = rule.getMatchedCategory();
        Long categoryId = categoryService.getCategoryIdByName(matchedCategoryName);
        return Category.createCategory(categoryId, matchedCategoryName, SYSTEM_CATEGORIZED, LocalDate.now());
    }
}
