package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.CategoryRule;
import com.app.budgetbuddy.domain.Transaction;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryRuleMatcher
{
    public Boolean ruleMatchesTransaction(CategoryRule categoryRule, Transaction transaction){
        return null;
    }

    public List<CategoryRule> getMatchingCategoryRulesForTransaction(Transaction transaction)
    {
        return null;
    }
}
