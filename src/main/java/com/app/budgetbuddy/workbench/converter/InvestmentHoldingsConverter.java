package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.InvestmentHoldings;
import com.plaid.client.model.Holding;
import org.springframework.stereotype.Component;

@Component
public class InvestmentHoldingsConverter implements Converter<Holding, InvestmentHoldings>
{

    @Override
    public InvestmentHoldings convert(Holding holdings)
    {
        if (holdings == null) {
            return null;
        }
        return InvestmentHoldings.builder()
                .accountId(holdings.getAccountId())
                .securityId(holdings.getSecurityId())
                .amount(holdings.getInstitutionValue() != null ? holdings.getInstitutionValue() : 0.0)
                .vestedAmount(holdings.getVestedValue() != null ? holdings.getVestedValue() : 0.0)
                .costBasis(holdings.getCostBasis() != null ? holdings.getCostBasis() : 0.0)
                .build();
    }
}
