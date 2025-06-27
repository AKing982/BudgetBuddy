package com.app.budgetbuddy.domain;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor(access= AccessLevel.PUBLIC)
public class BPWeekDetail
{
    private Long id;
    private Long template_detail_id;
    private DateRange weekRange;
    private BigDecimal plannedAmount;
    private BigDecimal actualAmount;
    private BigDecimal predictedAmount;
    private BigDecimal spendingPercentage;
    private BigDecimal savingsPercentage;
    private BigDecimal budgetedPercentage;
    private BigDecimal accountBalance;
    private List<BPCategoryDetail> categoryDetails = new ArrayList<>();

    public BPWeekDetail(Long id, Long template_detail_id, DateRange weekRange, BigDecimal plannedAmount, BigDecimal actualAmount, BigDecimal predictedAmount, BigDecimal spendingPercentage, BigDecimal savingsPercentage, BigDecimal budgetedPercentage, BigDecimal accountBalance)
    {
        this.id = id;
        this.template_detail_id = template_detail_id;
        this.weekRange = weekRange;
        this.plannedAmount = plannedAmount;
        this.actualAmount = actualAmount;
        this.predictedAmount = predictedAmount;
        this.spendingPercentage = spendingPercentage;
        this.savingsPercentage = savingsPercentage;
        this.budgetedPercentage = budgetedPercentage;
        this.accountBalance = accountBalance;
    }
}
