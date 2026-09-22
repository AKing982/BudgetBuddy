package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.InvestmentHoldings;
import com.app.budgetbuddy.entities.InvestmentHoldingsEntity;
import org.springframework.stereotype.Component;

@Component
public class InvestmentHoldingsToEntityConverter implements Converter<InvestmentHoldings, InvestmentHoldingsEntity>
{

    @Override
    public InvestmentHoldingsEntity convert(InvestmentHoldings investmentHoldings)
    {
        if(investmentHoldings == null)
        {
            return null;
        }
        InvestmentHoldingsEntity entity = new InvestmentHoldingsEntity();
        entity.setName(investmentHoldings.getName());
        entity.setSecurityId(investmentHoldings.getSecurityId());
        entity.setAmount(investmentHoldings.getAmount());
        entity.setVestedAmount(investmentHoldings.getVestedAmount());
        entity.setCostBasis(investmentHoldings.getCostBasis());
        // account: not resolvable from accountId String alone — caller must attach after conversion
        return entity;
    }
}
