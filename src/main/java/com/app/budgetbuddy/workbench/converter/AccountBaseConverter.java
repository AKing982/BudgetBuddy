package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.PlaidAccount;
import com.app.budgetbuddy.entities.AccountEntity;
import com.app.budgetbuddy.entities.UserEntity;
import com.plaid.client.model.AccountBase;
import com.plaid.client.model.AccountSubtype;
import com.plaid.client.model.AccountType;

public class AccountBaseConverter
{

    public AccountEntity convert(PlaidAccount accountBase, UserEntity userEntity) {
        AccountEntity accountEntity = new AccountEntity();
        accountEntity.setAccountReferenceNumber(accountBase.getAccountId());
        accountEntity.setBalance(accountBase.getBalance());
        accountEntity.setAccountName(accountBase.getName());
        accountEntity.setSubtype(AccountSubtype.valueOf(accountBase.getSubtype().toUpperCase()));
        accountEntity.setType(AccountType.valueOf(accountBase.getType().toUpperCase()));
        accountEntity.setMask(accountBase.getMask());
        accountEntity.setOfficialName(accountBase.getOfficialName());
        accountEntity.setUser(userEntity);
        return accountEntity;
    }
}
