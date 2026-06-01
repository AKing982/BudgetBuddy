package com.app.budgetbuddy.services;


import com.app.budgetbuddy.domain.EnvelopeContribution;
import com.app.budgetbuddy.entities.EnvelopeContributionHistoryEntity;

import java.time.LocalDate;

public interface EnvelopeContributionHistoryService extends ServiceModel<EnvelopeContributionHistoryEntity>
{
    void createAndSaveContribution(EnvelopeContribution envelopeContribution, LocalDate dateOfContribution);
}
