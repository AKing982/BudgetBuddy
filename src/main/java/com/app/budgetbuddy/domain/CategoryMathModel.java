package com.app.budgetbuddy.domain;

import com.app.budgetbuddy.domain.math.AbstractMathModel;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor(access= AccessLevel.PUBLIC)
public class CategoryMathModel
{
    private String category;
    private AbstractMathModel spendingModel;
    private AbstractMathModel savingsModel;
    private AbstractMathModel goalsReachedModel;
    private AbstractMathModel allocatedAmountModel;

    public CategoryMathModel(AbstractMathModel spendingModel, AbstractMathModel savingsModel, AbstractMathModel goalsReachedModel, AbstractMathModel allocatedAmountModel, String category)
    {
        this.spendingModel = spendingModel;
        this.savingsModel = savingsModel;
        this.goalsReachedModel = goalsReachedModel;
        this.allocatedAmountModel = allocatedAmountModel;
        this.category = category;
    }
}
