package com.app.budgetbuddy.workbench;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class PercentageCalculator
{
    private static double[] INCOME_BRACKETS = {
            1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000, Double.MAX_VALUE
    };

    private static final BigDecimal[] GROCERY_PERCENTAGES = {
            BigDecimal.valueOf(0.12),  // < 1000
            BigDecimal.valueOf(0.11),  // 1000-1999
            BigDecimal.valueOf(0.10),  // 2000-2999
            BigDecimal.valueOf(0.10),  // 3000-3999
            BigDecimal.valueOf(0.09), // 4000-4999
            BigDecimal.valueOf(0.07),  // 5000-5999
            BigDecimal.valueOf(0.065), // 6000-6999
            BigDecimal.valueOf(0.06),  // 7000-7999
            BigDecimal.valueOf(0.06),  // 8000-8999
            BigDecimal.valueOf(0.055), // 9000-9999
            BigDecimal.valueOf(0.05)   // >= 10000
    };

    private static final BigDecimal[] RENT_PERCENTAGES = {
            BigDecimal.valueOf(0.70),  // < 1000
            BigDecimal.valueOf(0.55),  // 1000-1999
            BigDecimal.valueOf(0.50),  // 2000-2999
            BigDecimal.valueOf(0.60),  // 3000-3999
            BigDecimal.valueOf(0.40),  // 4000-4999
            BigDecimal.valueOf(0.38),  // 5000-5999
            BigDecimal.valueOf(0.36),  // 6000-6999
            BigDecimal.valueOf(0.34),  // 7000-7999
            BigDecimal.valueOf(0.32),  // 8000-8999
            BigDecimal.valueOf(0.31),  // 9000-9999
            BigDecimal.valueOf(0.30)   // >= 10000
    };

    // Utilities percentages for each bracket
    private static final BigDecimal[] UTILITIES_PERCENTAGES = {
            BigDecimal.valueOf(0.05),  // < 1000
            BigDecimal.valueOf(0.12),  // 1000-1999
            BigDecimal.valueOf(0.10),  // 2000-2999
            BigDecimal.valueOf(0.09),  // 3000-3999
            BigDecimal.valueOf(0.08),  // 4000-4999
            BigDecimal.valueOf(0.07),  // 5000-5999
            BigDecimal.valueOf(0.065), // 6000-6999
            BigDecimal.valueOf(0.06),  // 7000-7999
            BigDecimal.valueOf(0.055), // 8000-8999
            BigDecimal.valueOf(0.05),  // 9000-9999
            BigDecimal.valueOf(0.05)   // >= 10000
    };

    private static final BigDecimal[] ORDER_OUT_PERCENTAGES = {
            BigDecimal.valueOf(0.03),  // < 1000
            BigDecimal.valueOf(0.03),  // 1000-1999
            BigDecimal.valueOf(0.04),  // 2000-2999
            BigDecimal.valueOf(0.05),  // 3000-3999
            BigDecimal.valueOf(0.055), // 4000-4999
            BigDecimal.valueOf(0.06),  // 5000-5999
            BigDecimal.valueOf(0.065), // 6000-6999
            BigDecimal.valueOf(0.07),  // 7000-7999
            BigDecimal.valueOf(0.075), // 8000-8999
            BigDecimal.valueOf(0.08),  // 9000-9999
            BigDecimal.valueOf(0.085)  // >= 10000
    };

    private static final BigDecimal[] SUBSCRIPTION_PERCENTAGES = {
            BigDecimal.valueOf(0.02),  // < 1000
            BigDecimal.valueOf(0.02),  // 1000-1999
            BigDecimal.valueOf(0.025), // 2000-2999
            BigDecimal.valueOf(0.03),  // 3000-3999
            BigDecimal.valueOf(0.03),  // 4000-4999
            BigDecimal.valueOf(0.03),  // 5000-5999
            BigDecimal.valueOf(0.03),  // 6000-6999
            BigDecimal.valueOf(0.028), // 7000-7999
            BigDecimal.valueOf(0.025), // 8000-8999
            BigDecimal.valueOf(0.02),  // 9000-9999
            BigDecimal.valueOf(0.02)   // >= 10000
    };

    private static final BigDecimal[] GAS_FUEL_PERCENTAGES = {
            BigDecimal.valueOf(0.01),
            BigDecimal.valueOf(0.015),
            BigDecimal.valueOf(0.02),
            BigDecimal.valueOf(0.02),
            BigDecimal.valueOf(0.02),
            BigDecimal.valueOf(0.02),
            BigDecimal.valueOf(0.018),
            BigDecimal.valueOf(0.018),
            BigDecimal.valueOf(0.015),
            BigDecimal.valueOf(0.015),
    };

    private static final BigDecimal[] INSURANCE_PERCENTAGES = {
            BigDecimal.valueOf(0.15),
            BigDecimal.valueOf(0.12),
            BigDecimal.valueOf(0.11),
            BigDecimal.valueOf(0.10),
            BigDecimal.valueOf(0.09),
            BigDecimal.valueOf(0.08),
            BigDecimal.valueOf(0.075),
            BigDecimal.valueOf(0.07),
            BigDecimal.valueOf(0.065),
            BigDecimal.valueOf(0.06)
    };

    private static final BigDecimal[] PAYMENTS_PERCENTAGES = {
            BigDecimal.valueOf(0.15),
            BigDecimal.valueOf(0.13),
            BigDecimal.valueOf(0.12),
            BigDecimal.valueOf(0.11),
            BigDecimal.valueOf(0.10),
            BigDecimal.valueOf(0.09),
            BigDecimal.valueOf(0.08),
            BigDecimal.valueOf(0.07),
            BigDecimal.valueOf(0.065),
            BigDecimal.valueOf(0.06)
    };

    public BigDecimal getPercentageByIncome(final double incomeAmount, final BigDecimal[] percentages)
    {
        if(incomeAmount == 0 || percentages == null)
        {
            return BigDecimal.ZERO;
        }
        int bracketIndex = 0;
        while(bracketIndex < INCOME_BRACKETS.length && incomeAmount >= INCOME_BRACKETS[bracketIndex])
        {
            bracketIndex++;
        }
        return percentages[bracketIndex];
    }

    public BigDecimal getPaymentsPercentage(double incomeAmount)
    {
        return getPercentageByIncome(incomeAmount, PAYMENTS_PERCENTAGES);
    }

    public BigDecimal getInsurancePercentage(double incomeAmount)
    {
        return getPercentageByIncome(incomeAmount, INSURANCE_PERCENTAGES);
    }

    public BigDecimal getGroceryPercentage(double incomeAmount)
    {
        return getPercentageByIncome(incomeAmount, GROCERY_PERCENTAGES);
    }

    public BigDecimal getGasFuelPercentage(double incomeAmount)
    {
        return getPercentageByIncome(incomeAmount, GAS_FUEL_PERCENTAGES);
    }

    public BigDecimal getRentPercentage(double incomeAmount)
    {
        return getPercentageByIncome(incomeAmount, RENT_PERCENTAGES);
    }

    public BigDecimal getUtilitiesPercentage(double incomeAmount)
    {
        return getPercentageByIncome(incomeAmount, UTILITIES_PERCENTAGES);
    }

    public BigDecimal getOrderOutPercentage(double incomeAmount)
    {
        return getPercentageByIncome(incomeAmount, ORDER_OUT_PERCENTAGES);
    }

    public BigDecimal getSubscriptionPercentage(double incomeAmount)
    {
        return getPercentageByIncome(incomeAmount, SUBSCRIPTION_PERCENTAGES);
    }

    public BigDecimal estimateCategoryPercentage(final double incomeAmount, final String category)
    {
        switch(category){
            case "Payments":
                return getPaymentsPercentage(incomeAmount);
            case "Insurance":
                return getInsurancePercentage(incomeAmount);
            case "Gas":
                return getGasFuelPercentage(incomeAmount);
            case "Order Out":
                return getOrderOutPercentage(incomeAmount);
            case "Subscription":
                return getSubscriptionPercentage(incomeAmount);
            case "Utilities":
                return getUtilitiesPercentage(incomeAmount);
            case "Groceries":
                return getGroceryPercentage(incomeAmount);
            case "Rent":
                return getRentPercentage(incomeAmount);
            default:
                throw new RuntimeException("Invalid category: " + category);
        }
    }


}
