package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.AccountSubType;
import com.app.budgetbuddy.domain.AccountType;
import com.app.budgetbuddy.domain.PlaidAccount;
import com.app.budgetbuddy.entities.AccountEntity;
import com.app.budgetbuddy.entities.UserEntity;
import com.plaid.client.model.AccountBase;
import com.plaid.client.model.AccountSubtype;

public class AccountBaseConverter
{

    public AccountEntity convert(PlaidAccount accountBase, UserEntity userEntity) {
        AccountEntity accountEntity = new AccountEntity();
        accountEntity.setId(accountBase.getAccountId());
        accountEntity.setBalance(accountBase.getBalance());
        accountEntity.setAccountName(accountBase.getName());
        accountEntity.setSubtype(AccountSubType.fromString(accountBase.getSubtype()));
        accountEntity.setType(AccountType.fromString(accountBase.getType()));
        if(accountBase.getMask() == null)
        {
            accountEntity.setMask("");
        }
        else
        {
            accountEntity.setMask(accountBase.getMask());
        }
        accountEntity.setOfficialName(accountBase.getOfficialName());
        accountEntity.setUser(userEntity);
        return accountEntity;
    }
}
