package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.AccountBalanceHistoryEntity;

import java.time.LocalDate;
import java.util.Optional;

public interface AccountBalanceHistoryService extends ServiceModel<AccountBalanceHistoryEntity>
{
    Optional<AccountBalanceHistoryEntity> findByAccountIdAndDateRange(
            String accountId, LocalDate startDate, LocalDate endDate);

    Optional<AccountBalanceHistoryEntity> findByAccountId(String accountId);
}
