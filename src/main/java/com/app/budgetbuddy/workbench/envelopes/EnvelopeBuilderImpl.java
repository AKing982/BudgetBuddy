package com.app.budgetbuddy.workbench.envelopes;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.EnvelopeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class EnvelopeBuilderImpl implements EnvelopeBuilder<NewEnvelopeCriteria, Envelope>
{
    private final EnvelopeBuilderService envelopeBuilderService;

    @Autowired
    public EnvelopeBuilderImpl(EnvelopeBuilderService envelopeBuilderService)
    {
        this.envelopeBuilderService = envelopeBuilderService;
    }

    @Override
    public Optional<Envelope> build(NewEnvelopeCriteria criteria, BudgetCriteria budgetCriteria, List<SubBudget> subBudgets) {
        return Optional.empty();
    }
}
