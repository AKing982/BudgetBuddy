package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.CSVAccountEntity;
import com.app.budgetbuddy.exceptions.CategoryException;
import com.app.budgetbuddy.repositories.CSVAccountRepository;
import com.app.budgetbuddy.services.CategoryService;
import com.app.budgetbuddy.services.SystemCategoryRulesService;
import com.app.budgetbuddy.services.TransactionRuleService;
import com.app.budgetbuddy.services.UserCategoryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Slf4j
@Qualifier("csvCategorizer")
public class CSVTransactionCategorizationEngine implements CategorizationEngine<TransactionCSV>
{
    private final TransactionRuleService transactionRuleService;
    private final CSVAccountRepository csvAccountRepository;
    private final CategoryService categoryService;
    private final UserCategoryService userCategoryService;
    private final List<CSVCategorizationStrategy> strategies;
    private final SystemCategoryRulesService systemCategoryRulesService;
    private final String SYSTEM_CATEGORIZED = "SYSTEM";
    private final String USER_CATEGORIZED = "USER";

    @Autowired
    public CSVTransactionCategorizationEngine(TransactionRuleService transactionRuleService,
                                              CSVAccountRepository csvAccountRepository,
                                              CategoryService categoryService,
                                              UserCategoryService userCategoryService,
                                              SystemCategoryRulesService systemCategoryRulesService,
                                              List<CSVCategorizationStrategy> strategies)
    {
        this.transactionRuleService = transactionRuleService;
        this.csvAccountRepository = csvAccountRepository;
        this.categoryService = categoryService;
        this.userCategoryService = userCategoryService;
        this.systemCategoryRulesService = systemCategoryRulesService;
        this.strategies = strategies;
    }

    @Override
    public Category categorize(TransactionCSV transaction)
    {
        if(transaction == null)
        {
            return Category.createUncategorized();
        }
        double absAmount = transaction.getTransactionAmount()
                .stripTrailingZeros().abs()
                .setScale(2, BigDecimal.ROUND_HALF_UP)
                .doubleValue();

        String merchantNameUpper = transaction.getMerchantName().toUpperCase();
        String institutionId = transaction.getInstitution_id();
        String transactionCategory = transaction.getCategory();
        Long userId = transaction.getUserId();
        try
        {
            // User rules always take priority
            List<TransactionRule> userRules = transactionRuleService.findByUserId(userId);
            if(!userRules.isEmpty())
            {
                Category userMatch = applyUserRules(transaction, userRules, userId);
                return userMatch != null ? userMatch : Category.createUncategorized();
            }

            // Pick the right strategy and categorize
            return strategies.stream()
                    .filter(s -> s.supports(institutionId))
                    .findFirst()
                    .map(s -> s.categorize(merchantNameUpper, transactionCategory,
                            absAmount))
                    .orElseGet(Category::createUncategorized);
        }
        catch(CategoryException e)
        {
            log.error("Error categorizing csv transaction {}: {}", transaction, e.getMessage());
            throw e;
        }
    }

    private Category applyUserRules(TransactionCSV transaction, List<TransactionRule> userRules, Long userId)
    {
        Map<Integer, List<TransactionRule>> rulesByPriority = userRules.stream()
                .filter(rule -> rule != null && rule.isActive())
                .collect(Collectors.groupingBy(TransactionRule::getPriority));

        long startTime = System.currentTimeMillis();
        for(Integer priority : rulesByPriority.keySet().stream().sorted().toList())
        {
            for(TransactionRule rule : rulesByPriority.get(priority))
            {
                if(matches(transaction, rule))
                {
                    rule.setMatchCount(rule.getMatchCount() + 1);
                    transactionRuleService.updateMatchCount(rule.getId(), rule.getMatchCount());
                    String matchedCategoryName = rule.getCategoryName();
                    log.info("User rule matched: {} in {} ms", rule, System.currentTimeMillis() - startTime);
                    Long userCategoryId = userCategoryService.getCategoryIdByNameAndUser(matchedCategoryName, userId);
                    return Category.createCategory(userCategoryId, matchedCategoryName, USER_CATEGORIZED, LocalDate.now());
                }
            }
        }
        return null;
    }

    @Override
    public boolean matches(TransactionCSV transaction, TransactionRule transactionRule)
    {
        if(transaction == null || transactionRule == null)
        {
            return false;
        }
        BigDecimal transactionAmount = transaction.getTransactionAmount()
                .stripTrailingZeros();
        String merchantName = transaction.getMerchantName();
        String description = transaction.getDescription();
        String extendedDescription = transaction.getExtendedDescription();
        String merchantRule = transactionRule.getMerchantRule();
        String descriptionRule = transactionRule.getDescriptionRule();
        String extendedDescriptionRule = transactionRule.getExtendedDescriptionRule();
        double minAmount = transactionRule.getAmountMin();
        double maxAmount = transactionRule.getAmountMax();
        int priority = transactionRule.getPriority();

        // Check individual field matches
        boolean merchantRuleMatch = merchantRule != null && !merchantRule.isEmpty()
                && merchantRule.equalsIgnoreCase(merchantName) || merchantName.contains(merchantRule);
        boolean descriptionRuleMatch = descriptionRule == null || descriptionRule.isEmpty()
                || descriptionRule.equalsIgnoreCase(description);

        boolean extendedDescriptionRuleMatch = extendedDescriptionRule == null || extendedDescriptionRule.isEmpty()
                || extendedDescriptionRule.equalsIgnoreCase(extendedDescription);
        boolean amountMatch = transactionAmount.compareTo(BigDecimal.valueOf(minAmount)) >= 0
                && transactionAmount.compareTo(BigDecimal.valueOf(maxAmount)) <= 0;
        boolean minAmountMatch = transactionAmount.compareTo(BigDecimal.valueOf(minAmount)) >= 0;
        boolean maxAmountMatch = transactionAmount.compareTo(BigDecimal.valueOf(maxAmount)) <= 0;

        // Match based on priority level
        return switch (priority) {
            case 1 -> merchantRuleMatch && descriptionRuleMatch && extendedDescriptionRuleMatch && amountMatch;
            case 2 -> merchantRuleMatch && amountMatch;
            case 3 -> merchantRuleMatch && minAmountMatch;
            case 4 -> merchantRuleMatch && maxAmountMatch;
            case 5 -> descriptionRuleMatch && merchantRuleMatch;
            case 6 -> merchantRuleMatch;
            default -> false;
        };
    }
}
