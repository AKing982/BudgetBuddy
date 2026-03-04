package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.Category;
import com.app.budgetbuddy.domain.CategoryType;
import com.app.budgetbuddy.entities.SystemCategoryRulesEntity;
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
    private final SystemCategoryRulesService systemCategoryRulesService;
    private final MerchantMatcherService merchantMatcherService;
    private final String SYSTEM_CATEGORIZED = "SYSTEM";

    @Autowired
    public PlaidCategorizationStrategy(SystemCategoryRulesService systemCategoryRulesService, MerchantMatcherService merchantMatcherService)
    {
        this.systemCategoryRulesService = systemCategoryRulesService;
        this.merchantMatcherService = merchantMatcherService;
    }

    public Category categorize(String categoryId, String primary, String secondary, String merchantName)
    {
        Optional<SystemCategoryRulesEntity> rule = systemCategoryRulesService
                .findByPlaidFull(categoryId, primary, secondary);
        if(rule.isPresent())
        {
            log.info("Plaid - Matched Full: categoryId={}, primary={}, secondary={}", categoryId, primary, secondary);
            return buildCategory(rule.get());
        }

        // Priority 2: primary + secondary
        rule = systemCategoryRulesService.findByPlaidPrimaryAndSecondary(primary, secondary);
        if(rule.isPresent())
        {
            log.info("Plaid - Matched PrimarySecondary: primary={}, secondary={}", primary, secondary);
            return buildCategory(rule.get());
        }

        // Priority 5: categoryId + secondary
        rule = systemCategoryRulesService.findByPlaidCategoryIdAndSecondary(categoryId, secondary);
        if(rule.isPresent())
        {
            log.info("Plaid - Matched IdSecondary: categoryId={}, secondary={}", categoryId, secondary);
            return buildCategory(rule.get());
        }

        // Priority 6: categoryId + primary
        rule = systemCategoryRulesService.findByPlaidCategoryIdAndPrimary(categoryId, primary);
        if(rule.isPresent())
        {
            log.info("Plaid - Matched IdPrimary: categoryId={}, primary={}", categoryId, primary);
            return buildCategory(rule.get());
        }

        // Priority 7: primary only
        rule = systemCategoryRulesService.findByPlaidPrimaryOnly(primary);
        if(rule.isPresent())
        {
            log.info("Plaid - Matched PrimaryOnly: primary={}", primary);
            return buildCategory(rule.get());
        }

        // Priority 8: secondary only
        rule = systemCategoryRulesService.findByPlaidSecondaryOnly(secondary);
        if(rule.isPresent())
        {
            log.info("Plaid - Matched SecondaryOnly: secondary={}", secondary);
            return buildCategory(rule.get());
        }

        // Priority 9: categoryId only
        rule = systemCategoryRulesService.findByPlaidCategoryIdOnly(categoryId);
        if(rule.isPresent())
        {
            log.info("Plaid - Matched CategoryIdOnly: categoryId={}", categoryId);
            return buildCategory(rule.get());
        }

        // Priority 10: merchant name fallback
        if(merchantName != null && !merchantName.isEmpty())
        {
            Optional<CategoryType> categoryType = merchantMatcherService.matchMerchant(merchantName);
            if(categoryType.isPresent())
            {
                log.info("Plaid - Matched Merchant: merchantName={}", merchantName);
                return Category.createCategory("", categoryType.get().getType(), SYSTEM_CATEGORIZED, LocalDate.now());
            }
        }

        log.warn("Plaid - No rule matched: categoryId={}, primary={}, secondary={}, merchant={}",
                categoryId, primary, secondary, merchantName);
        return Category.createUncategorized();
    }

    private Category buildCategory(SystemCategoryRulesEntity rule)
    {
        return Category.createCategory("", rule.getMatchedCategory(), SYSTEM_CATEGORIZED, LocalDate.now());
    }
}
