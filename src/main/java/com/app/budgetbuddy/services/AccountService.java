package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.AccountEntity;

import java.util.Optional;

public interface AccountService extends ServiceModel<AccountEntity>
{
    Optional<AccountEntity> findByAccountId(String accountId);
}
