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
public abstract class BPWeekDetail
{
    private Long id;
    private Long template_detail_id;
    private DateRange weekRange;
    private BigDecimal plannedAmount;
    private BigDecimal actualAmount;
    private BigDecimal balance;
    private List<BPCategoryDetail> categoryDetails = new ArrayList<>();

    public BPWeekDetail(Long id, Long template_detail_id, DateRange weekRange, BigDecimal plannedAmount, BigDecimal actualAmount, BigDecimal balance)
    {
        this.id = id;
        this.template_detail_id = template_detail_id;
        this.weekRange = weekRange;
        this.plannedAmount = plannedAmount;
        this.actualAmount = actualAmount;
        this.balance = balance;
    }

    public void addCategoryDetail(BPCategoryDetail categoryDetail)
    {
        categoryDetails.add(categoryDetail);
    }

    public void removeCategoryDetail(BPCategoryDetail categoryDetail)
    {
        categoryDetails.remove(categoryDetail);
    }

}
