package com.app.budgetbuddy.workbench.categories;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.app.budgetbuddy.domain.Category;
import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.domain.TransactionCSV;
import com.app.budgetbuddy.domain.TransactionRule;
import com.app.budgetbuddy.services.UserCategoryService;
import com.app.budgetbuddy.workbench.MerchantMatcherService;

@Component
public abstract class AbstractCategorizationEngine<T extends Transaction>
{
    protected UserCategoryService userCategoryService;
    protected TransactionRuleService transactionRuleService;
    protected MerchantMatcherService merchantMatcherService;
    protected final String SYSTEM_CATEGORIZED = "SYSTEM";
    protected final String USER_CATEGORIZED = "USER";

    @Autowired
    public AbstractCategorizationEngine(UserCategoryService userCategoryService,
                                        TransactionRuleService transactionRuleService,
                                        MerchantMatcherService matcherService){
        this.userCategoryService = userCategoryService;
        this.transactionRuleService = transactionRuleService;
        this.merchantMatcherService = matcherService;
    }

    protected List<TransactionRule> getUserTransactionRules(Long userId)
    {
        return transactionRuleService.findByUserId(userId);
    }

    protected Category matchTransactionRule(T transaction, Long userId, List<TransactionRule> rules)
    {
        Object obj = (Object) transaction;
        Category category = null;
        Map<Integer, List<TransactionRule>> sortedTransactionRulesByPriority = rules.stream()
                .filter(r -> r != null && r.isActive() && r.getPriority() > 0)
                .collect(Collectors.groupingBy(TransactionRule::getPriority));
        List<Integer> sortedPriorities = sortedTransactionRulesByPriority.keySet()
                .stream().sorted().toList();
        for(Integer priority : sortedPriorities)
        {
            List<TransactionRule> sortedRules = sortedTransactionRulesByPriority.get(priority);
            for(TransactionRule rule : sortedRules)
            {
                int match_count = 0;
                Long ruleId = 1L;
                if(matches(transaction, rule))
                {
                    match_count++;
                    transactionRuleService.updateMatchCount(ruleId, match_count);
                    String matched_category = rule.getCategoryName();
                    Long user_category_id = userCategoryService.getCategoryIdByNameAndUser(matched_category, userId);
                    if(obj instanceof Transaction){
                        Transaction t = (Transaction) obj;
                        String plaidCategoryId = t.getCategoryId();
                        category = Category.createCategory(user_category_id, plaidCategoryId, matched_category, matched_category, LocalDate.now());
                    }else if(obj instanceof TransactionCSV){
                        category = Category.createCategory(user_category_id, matched_category, USER_CATEGORIZED, LocalDate.now());
                    }
                }
            }
        }
        return category;
    }

    private boolean matches(T transaction, TransactionRule rule)
    {
        BigDecimal amount;
        String merchant;
        String description;
        String rawName;
        if(transaction == null || rule == null)
        {
            return false;
        }
        Object obj = (Object) transaction;
        if (obj instanceof Transaction t)
        {
            amount = t.getAmount();
            merchant = t.getMerchantName();
            description = t.getDescription();
            rawName = t.getName();
        }
        else if (obj instanceof TransactionCSV tCsv)
        {
            amount = tCsv.getTransactionAmount();
            merchant = tCsv.getMerchantName();
            description = tCsv.getDescription();
            rawName = tCsv.getExtendedDescription();
        }
        else
        {
            return false;
        }
        BigDecimal cleanAmount = (amount != null) ? amount.abs().stripTrailingZeros() : BigDecimal.ZERO;
        String mRule = rule.getMerchantRule();
        String dRule = rule.getDescriptionRule();
        String eRule = rule.getExtendedDescriptionRule();

        // 3. Define the atomic matching bits
        boolean merchantMatch = isNonEmpty(mRule) &&
                (safeEquals(merchant, mRule) || safeContains(merchant, mRule));

        boolean descriptionMatch = isNonEmpty(dRule) && safeEquals(description, dRule);

        boolean extendedMatch = isNonEmpty(eRule) &&
                (safeContains(description, eRule) || safeContains(rawName, eRule));

        boolean inAmountRange = cleanAmount.compareTo(BigDecimal.valueOf(rule.getAmountMin())) >= 0 &&
                cleanAmount.compareTo(BigDecimal.valueOf(rule.getAmountMax())) <= 0;

        // 4. Apply the Priority Switch (The "Brains" of the matching)
        return switch (rule.getPriority()) {
            case 1 -> merchantMatch && descriptionMatch && extendedMatch && inAmountRange;
            case 2 -> merchantMatch && inAmountRange;
            case 3 -> merchantMatch && cleanAmount.compareTo(BigDecimal.valueOf(rule.getAmountMin())) >= 0;
            case 4 -> merchantMatch && cleanAmount.compareTo(BigDecimal.valueOf(rule.getAmountMax())) <= 0;
            case 5 -> descriptionMatch && merchantMatch;
            case 6 -> merchantMatch;
            default -> false;
        };

    }

    private boolean isNonEmpty(String s) { return s != null && !s.isEmpty(); }
    private boolean safeEquals(String target, String rule) {
        return target != null && target.equalsIgnoreCase(rule);
    }
    private boolean safeContains(String target, String rule) {
        return target != null && target.toLowerCase().contains(rule.toLowerCase());
    }

    protected Long findUserCategory(Long userId, String category)
    {
        return userCategoryService.getCategoryIdByNameAndUser(category, userId);
    }

    protected void updateTransactionRuleMatchCount(Long ruleId, int match_count)
    {
        transactionRuleService.updateMatchCount(ruleId, match_count);
    }
}