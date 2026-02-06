package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.Category;
import com.app.budgetbuddy.domain.RecurringTransaction;
import com.app.budgetbuddy.domain.TransactionRule;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class RecurringTransactionCategorizerServiceImpl extends AbstractTransactionMatcher<RecurringTransaction> implements CategorizerService<RecurringTransaction>
{

    @Override
    public Category categorize(RecurringTransaction transaction) {
        return null;
    }

    @Override
    public boolean matches(RecurringTransaction transaction, TransactionRule transactionRule) {
        return false;
    }
}
