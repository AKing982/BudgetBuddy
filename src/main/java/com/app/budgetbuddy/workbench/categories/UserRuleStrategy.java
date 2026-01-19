//package com.app.budgetbuddy.workbench.categories;
//
//import com.app.budgetbuddy.domain.CategoryType;
//import com.app.budgetbuddy.domain.Transaction;
//import com.app.budgetbuddy.domain.TransactionRule;
//import org.springframework.beans.factory.annotation.Qualifier;
//import org.springframework.stereotype.Component;
//
//import java.util.List;
//
//@Component
//@Qualifier("UserRuleStrategy")
//public class UserRuleStrategy implements CategorizationStrategy
//{
//    private final CategoryType UNCATEGORIZED = CategoryType.UNCATEGORIZED;
//
//    @Override
//    public CategoryType categorize(Transaction transaction)
//    {
//        return CategoryType.UNCATEGORIZED;
//    }
//
//    @Override
//    public boolean supportsUserRules() {
//        return true;
//    }
//
//    public boolean matchesUserRule(final Transaction transaction, final TransactionRule transactionRule)
//    {
//        if(transaction == null || transactionRule == null)
//        {
//            return false;
//        }
//        String transactionDescription = transaction.getDescription();
//        String merchantRulePattern = transactionRule.getMerchantPattern();
//        String merchantName = transaction.getMerchantName();
//        String descriptionRulePattern = transactionRule.getDescriptionPattern();
//        if(descriptionRulePattern.contains(transactionDescription))
//        {
//            return true;
//        }
//        else return merchantRulePattern.contains(merchantName);
//    }
//
//    @Override
//    public CategoryType categorizeWithUserRules(final Transaction transaction, final List<TransactionRule> transactionRuleList)
//    {
//        if(transactionRuleList == null || transactionRuleList.isEmpty())
//        {
//            return UNCATEGORIZED;
//        }
//        for(TransactionRule rule : transactionRuleList)
//        {
//            if(rule.isActive() && matchesUserRule(transaction, rule))
//            {
//                return CategoryType.valueOf(rule.getMatchedCategory());
//            }
//        }
//        return UNCATEGORIZED;
//    }
//}
