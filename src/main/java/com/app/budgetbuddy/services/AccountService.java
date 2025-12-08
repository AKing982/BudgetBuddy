package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.AccountEntity;

import java.util.List;
import java.util.Optional;

public interface AccountService extends ServiceModel<AccountEntity>
{
    Optional<AccountEntity> findByAccountId(String accountId);
    String findAccountIdByAccountName(String accountName);
    List<AccountEntity> findByUser(Long userId);
}
