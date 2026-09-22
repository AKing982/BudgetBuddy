package com.app.budgetbuddy.domain;

import com.app.budgetbuddy.entities.AccountEntity;
import com.app.budgetbuddy.entities.InvestmentHoldingsEntity;
import com.app.budgetbuddy.entities.InvestmentTransactionEntity;
import com.app.budgetbuddy.repositories.AccountRepository;
import com.app.budgetbuddy.repositories.InvestmentHoldingsRepository;
import com.app.budgetbuddy.workbench.converter.Converter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class InvestmentTransactionToEntityConverter implements Converter<InvestmentTransaction, InvestmentTransactionEntity>
{
    private final AccountRepository accountRepository;
    private final InvestmentHoldingsRepository investmentHoldingsRepository;

    @Autowired
    public InvestmentTransactionToEntityConverter(AccountRepository accountRepository,
                                                  InvestmentHoldingsRepository investmentHoldingsRepository)
    {
        this.accountRepository = accountRepository;
        this.investmentHoldingsRepository = investmentHoldingsRepository;
    }

    @Override
    public InvestmentTransactionEntity convert(InvestmentTransaction investmentTransaction)
    {
        if(investmentTransaction == null)
        {
            return null;
        }
        AccountEntity accountEntity = accountRepository.findByAccountId(investmentTransaction.getAccountId())
                .orElseThrow(() -> new IllegalArgumentException("Account not found for accountId: " + investmentTransaction.getAccountId()));

        InvestmentTransactionEntity entity = new InvestmentTransactionEntity();
        entity.setInvestmentTransactionId(investmentTransaction.getInvestmentTransactionId());
        entity.setId(investmentTransaction.getId());
        entity.setName(investmentTransaction.getName());
        entity.setPrice(investmentTransaction.getPrice());
        entity.setAmount(investmentTransaction.getAmount());
        entity.setQuantity(investmentTransaction.getQuantity());
        entity.setDate(investmentTransaction.getDate() != null ? investmentTransaction.getDate() : null);
        entity.setAccount(accountEntity);
        entity.setType(investmentTransaction.getType() != null ? investmentTransaction.getType().toString() : null);
        entity.setSubtype(investmentTransaction.getSubtype() != null ? investmentTransaction.getSubtype().toString() : null);
        return entity;
    }
}
