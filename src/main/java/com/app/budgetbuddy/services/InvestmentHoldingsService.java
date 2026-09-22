package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.InvestmentHoldings;
import com.app.budgetbuddy.entities.InvestmentHoldingsEntity;

import java.util.List;

public interface InvestmentHoldingsService extends ServiceModel<InvestmentHoldingsEntity>
{
    List<InvestmentHoldingsEntity> createAndSave(List<InvestmentHoldings> investmentHoldings);
    List<InvestmentHoldingsEntity> findByUserId(Long userId);
}
