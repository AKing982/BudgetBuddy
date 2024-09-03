package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.entities.AccountEntity;
import com.app.budgetbuddy.entities.UserEntity;
import com.plaid.client.model.AccountBase;

public class AccountBaseConverter
{

    public AccountEntity convert(AccountBase accountBase, UserEntity userEntity) {
        AccountEntity accountEntity = new AccountEntity();
        accountEntity.setAccountId(accountBase.getAccountId());
        accountEntity.setAccountName(accountBase.getName());
        accountEntity.setSubtype(accountBase.getSubtype());
        accountEntity.setType(accountBase.getType());
        accountEntity.setMask(accountBase.getMask());
        accountEntity.setOfficialName(accountBase.getOfficialName());
        accountEntity.setUser(userEntity);
        return accountEntity;
    }
}
