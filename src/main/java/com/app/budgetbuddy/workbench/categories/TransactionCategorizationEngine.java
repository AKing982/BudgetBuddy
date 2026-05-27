package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.AccountEntity;
import com.app.budgetbuddy.exceptions.AccountNotFoundException;
import com.app.budgetbuddy.exceptions.CategoryException;
import com.app.budgetbuddy.services.AccountService;
import com.app.budgetbuddy.services.TransactionRuleService;
import com.app.budgetbuddy.services.UserCategoryService;
import com.app.budgetbuddy.workbench.MerchantMatcherService;
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

@Service
@Slf4j
@Qualifier("transactionCategorizer")
public class TransactionCategorizationEngine extends AbstractCategorizationEngine<Transaction> implements CategorizationEngine<Transaction>
{
    private final PlaidCategorizationStrategy plaidStrategy;
    private AccountService accountService;

    @Autowired
    public TransactionCategorizationEngine(UserCategoryService userCategoryService,
                                           AccountService accountService,
                                           TransactionRuleService transactionRuleService,
                                           MerchantMatcherService merchantMatcherService,
                                           PlaidCategorizationStrategy plaidStrategy)
    {
        super(userCategoryService, transactionRuleService, merchantMatcherService);
        this.accountService = accountService;
        this.plaidStrategy = plaidStrategy;
    }

    @Override
    public Category categorize(Transaction transaction)
    {
        if(transaction == null)
        {
            throw new CategoryException("Transaction was found null... Terminating categorization");
        }
        String acctId = transaction.getAccountId();
        AccountEntity accountEntity = accountService.findByAccountId(acctId)
                .orElseThrow(() -> new AccountNotFoundException("Account with id " + acctId + " not found"));
        Long userId = accountEntity.getUser().getId();
        log.debug("Categorizing transaction {}", transaction.toString());
        int transactionPriority = assignPriorityToTransaction(transaction);
        log.debug("Transaction priority: {}", transactionPriority);
        if(transactionPriority == 0)
        {
            throw new CategoryException("Transaction priority is 0... Terminating categorization");
        }
        List<TransactionRule> transactionRules = getUserTransactionRules(userId);
        Category matchedCategory = null;
        if(transactionRules.isEmpty())
        {
            matchedCategory = categorizeBySystemRules(transaction, transactionPriority);
        }
        else
        {
           matchedCategory = matchTransactionRule(transaction, userId, transactionRules);
        }
        if(matchedCategory != null)
        {
            log.debug("Matched category: {}", matchedCategory.toString());
        }
        return matchedCategory != null ? matchedCategory : Category.createUncategorized();
    }

    private Category categorizeBySystemRules(Transaction transaction, int priority)
    {
        return plaidStrategy.categorize(
                transaction.getCategoryId(),
                transaction.getPrimaryCategory(),
                transaction.getSecondaryCategory(),
                transaction.getMerchantName(),
                priority
        );
    }

    private int assignPriorityToTransaction(Transaction transaction)
    {
        boolean hasPrimary = transaction.getPrimaryCategory() != null;
        boolean hasSecondary = transaction.getSecondaryCategory() != null;
        boolean hasCategoryId = transaction.getCategoryId() != null;
        boolean hasMerchant = transaction.getMerchantName() != null;
        // Check combinations in priority order
        if (hasPrimary && hasSecondary && hasCategoryId) return 1;
        if (hasPrimary && hasSecondary) return 2;
        if (hasPrimary && hasMerchant) return 3;
        if (hasSecondary && hasMerchant) return 4;
        if (hasSecondary && hasCategoryId) return 5;
        if (hasPrimary && hasCategoryId) return 6;
        if (hasPrimary) return 7;
        if (hasSecondary) return 8;
        if (hasCategoryId) return 9;
        return 0;
    }

    @Override
    public boolean matches(Transaction transaction, TransactionRule transactionRule)
    {
        if(transaction == null || transactionRule == null || !transactionRule.isActive())
        {
            return false;
        }

        BigDecimal amount = transaction.getAmount();
        String description = transaction.getDescription();
        String primaryCategory = transaction.getPrimaryCategory();
        String secondaryCategory = transaction.getSecondaryCategory();
        String categoryId = transaction.getCategoryId();
        String merchantName = transaction.getMerchantName();
        String name = transaction.getName();
        if(transactionRule.getMerchantRule() != null &&
                !transactionRule.getMerchantRule().isEmpty() &&
                transactionRule.getMerchantRule().equalsIgnoreCase(merchantName))
        {
            return true;
        }

        // Match if description rule matches (case-insensitive)
        if(transactionRule.getDescriptionRule() != null &&
                !transactionRule.getDescriptionRule().isEmpty() &&
                transactionRule.getDescriptionRule().equalsIgnoreCase(description))
        {
            return true;
        }
        if(transactionRule.getExtendedDescriptionRule() != null &&
                !transactionRule.getExtendedDescriptionRule().isEmpty())
        {
            String extRule = transactionRule.getExtendedDescriptionRule().toLowerCase();
            boolean descMatch = description != null && description.toLowerCase().contains(extRule);
            boolean nameMatch = name != null && name.toLowerCase().contains(extRule);

            if(descMatch || nameMatch)
            {
                return matchesAmountRange(amount, transactionRule);
            }
        }

        return false;
    }

    private boolean matchesAmountRange(BigDecimal amount, TransactionRule rule)
    {
        if(amount == null)
        {
            return false;
        }

        double amountValue = amount.doubleValue();

        // If both min and max are 0, assume no amount restriction
        if(rule.getAmountMin() == 0 && rule.getAmountMax() == 0)
        {
            return true;
        }

        // Check if amount falls within the specified range
        return amountValue >= rule.getAmountMin() &&
                amountValue <= rule.getAmountMax();
    }
}
