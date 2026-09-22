package com.app.budgetbuddy.workbench.converter;

import com.plaid.client.model.InvestmentTransaction;
import org.springframework.stereotype.Component;

@Component
public class InvestmentTransactionsConverter implements Converter<InvestmentTransaction, com.app.budgetbuddy.domain.InvestmentTransaction>
{

    @Override
    public com.app.budgetbuddy.domain.InvestmentTransaction convert(InvestmentTransaction investmentTransaction)
    {
        if(investmentTransaction == null)
        {
            return null;
        }
        return com.app.budgetbuddy.domain.InvestmentTransaction.builder()
                .investmentTransactionId(investmentTransaction.getInvestmentTransactionId())
                .accountId(investmentTransaction.getAccountId())
                .securityId(investmentTransaction.getSecurityId())
                .amount(investmentTransaction.getAmount() != null ? investmentTransaction.getAmount() : 0.0)
                .date(investmentTransaction.getDate())
                .type(investmentTransaction.getType().toString())
                .subtype(investmentTransaction.getSubtype().toString())
                .name(investmentTransaction.getName())
                .quantity(investmentTransaction.getQuantity() != null ? investmentTransaction.getQuantity() : 0.0)
                .price(investmentTransaction.getPrice() != null ? investmentTransaction.getPrice() : 0.0)
                .fees(investmentTransaction.getFees() != null ? investmentTransaction.getFees() : 0.0)
                .build();

    }
}
