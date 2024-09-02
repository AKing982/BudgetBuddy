package com.app.budgetbuddy.entities;

import com.app.budgetbuddy.domain.ConfidenceLevel;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

@Embeddable
public class PersonalFinanceCategory
{
    private String primary;
    private String detailed;

    @Enumerated(EnumType.STRING)
    private ConfidenceLevel confidenceLevel;
}
