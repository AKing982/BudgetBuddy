package com.app.budgetbuddy.domain;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@Builder
public class SavingsCategory
{
    private final String categoryName = "Savings Category";
    private BigDecimal budgetedSavingsTarget;
    private BigDecimal actualSavedAmount;
    private BigDecimal remainingToSave;
    private boolean isActive;
    private LocalDate startDate;
    private LocalDate endDate;

    public SavingsCategory(BigDecimal budgetedSavingsTarget, BigDecimal actualSavedAmount, BigDecimal remainingToSave, boolean isActive, LocalDate startDate, LocalDate endDate) {
        this.budgetedSavingsTarget = budgetedSavingsTarget;
        this.actualSavedAmount = actualSavedAmount;
        this.remainingToSave = remainingToSave;
        this.isActive = isActive;
        this.startDate = startDate;
        this.endDate = endDate;
    }

    public static SavingsCategory create(BigDecimal budgeted, BigDecimal saved,  boolean isActive, LocalDate startDate, LocalDate endDate)
    {
        return SavingsCategory.builder()
                .budgetedSavingsTarget(budgeted)
                .actualSavedAmount(saved)
                .remainingToSave(budgeted.subtract(saved))
                .isActive(isActive)
                .startDate(startDate)
                .endDate(endDate)
                .build();
    }
}
