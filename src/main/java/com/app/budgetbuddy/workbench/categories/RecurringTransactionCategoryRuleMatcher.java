package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.CategoryRule;
import com.app.budgetbuddy.domain.RecurringTransaction;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class RecurringTransactionCategoryRuleMatcher implements TransactionMatcher<RecurringTransaction>
{
    private Map<RecurringTransaction, String> matchedRecurringTransactions = new HashMap<>();
    private List<RecurringTransaction> unmatchedRecurringTransactions = new ArrayList<>();

    @Override
    public String categorizeTransaction(RecurringTransaction transaction) {
        return "";
    }

    public void addMatchedRecurringTransactions(RecurringTransaction recurringTransaction, String category) {
        matchedRecurringTransactions.put(recurringTransaction, category);
    }

    public void addUnmatchedRecurringTransaction(RecurringTransaction recurringTransaction){
        unmatchedRecurringTransactions.add(recurringTransaction);
    }

    public Boolean matchRules(RecurringTransaction transaction, CategoryRule categoryRule) {
        return false;
    }
}
