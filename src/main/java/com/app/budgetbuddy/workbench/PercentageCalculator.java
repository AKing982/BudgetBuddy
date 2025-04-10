package com.app.budgetbuddy.workbench;

import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.InputMismatchException;
import java.util.Scanner;

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

    private static final BigDecimal[] OTHER_PURCHASES = {
            BigDecimal.valueOf(0.03),
            BigDecimal.valueOf(0.04),
            BigDecimal.valueOf(0.04),
            BigDecimal.valueOf(0.04),
            BigDecimal.valueOf(0.05),
            BigDecimal.valueOf(0.06),
            BigDecimal.valueOf(0.07),
            BigDecimal.valueOf(0.08),
            BigDecimal.valueOf(0.09),
            BigDecimal.valueOf(0.09),
            BigDecimal.valueOf(0.10)
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
            BigDecimal.valueOf(0.06),  // 1000-1999
            BigDecimal.valueOf(0.055),  // 2000-2999
            BigDecimal.valueOf(0.05),  // 3000-3999
            BigDecimal.valueOf(0.05),  // 4000-4999
            BigDecimal.valueOf(0.045),  // 5000-5999
            BigDecimal.valueOf(0.04), // 6000-6999
            BigDecimal.valueOf(0.04),  // 7000-7999
            BigDecimal.valueOf(0.035), // 8000-8999
            BigDecimal.valueOf(0.035),  // 9000-9999
            BigDecimal.valueOf(0.035)   // >= 10000
    };

    private static final BigDecimal[] ORDER_OUT_PERCENTAGES = {
            BigDecimal.valueOf(0.03),  // < 1000
            BigDecimal.valueOf(0.04),  // 1000-1999
            BigDecimal.valueOf(0.05),  // 2000-2999
            BigDecimal.valueOf(0.06),  // 3000-3999
            BigDecimal.valueOf(0.07), // 4000-4999
            BigDecimal.valueOf(0.08),  // 5000-5999
            BigDecimal.valueOf(0.09), // 6000-6999
            BigDecimal.valueOf(0.10),  // 7000-7999
            BigDecimal.valueOf(0.10), // 8000-8999
            BigDecimal.valueOf(0.10),  // 9000-9999
            BigDecimal.valueOf(0.10)  // >= 10000
    };

    private static final BigDecimal[] SUBSCRIPTION_PERCENTAGES = {
            BigDecimal.valueOf(0.10),  // < 1000
            BigDecimal.valueOf(0.08),  // 1000-1999
            BigDecimal.valueOf(0.06), // 2000-2999
            BigDecimal.valueOf(0.05),  // 3000-3999
            BigDecimal.valueOf(0.04),  // 4000-4999
            BigDecimal.valueOf(0.03),  // 5000-5999
            BigDecimal.valueOf(0.025),  // 6000-6999
            BigDecimal.valueOf(0.02), // 7000-7999
            BigDecimal.valueOf(0.015), // 8000-8999
            BigDecimal.valueOf(0.012),  // 9000-9999
            BigDecimal.valueOf(0.01)   // >= 10000
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
            BigDecimal.valueOf(0.10),
            BigDecimal.valueOf(0.08),
            BigDecimal.valueOf(0.07),
            BigDecimal.valueOf(0.06),
            BigDecimal.valueOf(0.05),
            BigDecimal.valueOf(0.04),
            BigDecimal.valueOf(0.035),
            BigDecimal.valueOf(0.03),
            BigDecimal.valueOf(0.025),
            BigDecimal.valueOf(0.02),
            BigDecimal.valueOf(0.015),
    };

    private static final BigDecimal[] PAYMENTS_PERCENTAGES = {
            BigDecimal.valueOf(0.20),
            BigDecimal.valueOf(0.17),
            BigDecimal.valueOf(0.15),
            BigDecimal.valueOf(0.13),
            BigDecimal.valueOf(0.12),
            BigDecimal.valueOf(0.11),
            BigDecimal.valueOf(0.10),
            BigDecimal.valueOf(0.09),
            BigDecimal.valueOf(0.08),
            BigDecimal.valueOf(0.07),
            BigDecimal.valueOf(0.06),
    };

    private static final BigDecimal[] SAVINGS_PERCENTAGES = {
            BigDecimal.valueOf(0.05),
            BigDecimal.valueOf(0.08),
            BigDecimal.valueOf(0.10),
            BigDecimal.valueOf(0.12),
            BigDecimal.valueOf(0.13),
            BigDecimal.valueOf(0.14),
            BigDecimal.valueOf(0.15),
            BigDecimal.valueOf(0.16),
            BigDecimal.valueOf(0.17),
            BigDecimal.valueOf(0.18),
            BigDecimal.valueOf(0.19)
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

    public BigDecimal getSavingsPercentage(double incomeAmount)
    {
        return getPercentageByIncome(incomeAmount, SAVINGS_PERCENTAGES);
    }

    public BigDecimal getOtherPurchasesPercentage(double incomeAmount)
    {
        return getPercentageByIncome(incomeAmount, OTHER_PURCHASES);
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
            case "Savings":
                return getSavingsPercentage(incomeAmount);
            case "Other":
                return getOtherPurchasesPercentage(incomeAmount);
            default:
                throw new RuntimeException("Invalid category: " + category);
        }
    }

    public static void main(String[] args)
    {
        Scanner scanner = new Scanner(System.in);
        PercentageCalculator calculator = new PercentageCalculator();

        System.out.println("Budget Percentage Calculator");
        System.out.println("===========================");

        // Prompt for income
        System.out.print("Enter your monthly income: $");
        double income = 0;

        try {
            income = scanner.nextDouble();
        } catch (InputMismatchException e) {
            System.out.println("Invalid input. Please enter a numeric value.");
            scanner.close();
            return;
        }

        System.out.println("\nRecommended Budget Percentages for $" + income + " Monthly Income:");
        System.out.println("-------------------------------------------------------");

        // Define categories by priority
        String[] primaryCategories = {"Rent", "Utilities", "Groceries", "Insurance", "Gas"};
        String[] savingsCategory = {"Savings"};
        String[] extraCategories = {"Order Out", "Subscription", "Payments", "Other"};

        BigDecimal total = BigDecimal.ZERO;

        // 1. Calculate and display primary categories first - these are non-negotiable
        System.out.println("PRIMARY CATEGORIES (Essentials):");
        BigDecimal primaryTotal = displayCategories(calculator, income, primaryCategories);
        total = total.add(primaryTotal);

        // Calculate what's left after primary categories
        BigDecimal remainingPercentage = BigDecimal.ONE.subtract(primaryTotal);

        // If remaining percentage is negative, we're already over budget
        if (remainingPercentage.compareTo(BigDecimal.ZERO) <= 0) {
            System.out.println("\nWARNING: Essential expenses exceed 100% of income!");
            System.out.println("You need to reduce expenses or increase income.");
            System.out.println("-------------------------------------------------------");
            String formattedTotal = total.multiply(BigDecimal.valueOf(100)).setScale(1, RoundingMode.HALF_UP) + "%";
            System.out.println("Total:        " + formattedTotal);
            scanner.close();
            return;
        }

        // 2. Allocate to savings next (target percentage based on income)
        System.out.println("\nSAVINGS (Target):");
        BigDecimal targetSavingsPercentage = calculator.getSavingsPercentage(income);
        BigDecimal savingsPercentage;

        // If we can't afford target savings, allocate what we can
        if (remainingPercentage.compareTo(targetSavingsPercentage) < 0) {
            savingsPercentage = remainingPercentage.multiply(BigDecimal.valueOf(0.5)); // Allocate 50% of what's left to savings
        } else {
            savingsPercentage = targetSavingsPercentage;
        }

        // Display actual savings allocation
        BigDecimal savingsAmount = savingsPercentage.multiply(BigDecimal.valueOf(income));
        String formattedSavingsPercentage = savingsPercentage.multiply(BigDecimal.valueOf(100))
                .setScale(1, RoundingMode.HALF_UP) + "%";
        String formattedSavingsAmount = "$" + savingsAmount.setScale(2, RoundingMode.HALF_UP);
        System.out.printf("%-12s %7s  (%s) - ", "Savings:", formattedSavingsPercentage, formattedSavingsAmount);

        // Compare to target
        if (savingsPercentage.compareTo(targetSavingsPercentage) < 0) {
            String targetPercentage = targetSavingsPercentage.multiply(BigDecimal.valueOf(100))
                    .setScale(1, RoundingMode.HALF_UP) + "%";
            System.out.println("Target: " + targetPercentage);
        } else {
            System.out.println("Target Met!");
        }

        total = total.add(savingsPercentage);
        remainingPercentage = remainingPercentage.subtract(savingsPercentage);

        // 3. Distribute remaining percentage to extra categories proportionally
        if (remainingPercentage.compareTo(BigDecimal.ZERO) > 0) {
            System.out.println("\nEXTRA CATEGORIES (Adjusted to fit remaining budget):");

            // Calculate initial sum of percentages for extra categories
            BigDecimal extraCategoriesSum = BigDecimal.ZERO;
            for (String category : extraCategories) {
                extraCategoriesSum = extraCategoriesSum.add(calculator.estimateCategoryPercentage(income, category));
            }

            // Don't divide by zero
            if (extraCategoriesSum.compareTo(BigDecimal.ZERO) > 0) {
                // Display adjusted extra categories
                for (String category : extraCategories) {
                    BigDecimal originalPercentage = calculator.estimateCategoryPercentage(income, category);

                    // Calculate proportional adjusted percentage
                    BigDecimal proportionalPercentage = originalPercentage.divide(extraCategoriesSum, 4, RoundingMode.HALF_UP);
                    BigDecimal adjustedPercentage = proportionalPercentage.multiply(remainingPercentage);

                    BigDecimal amount = adjustedPercentage.multiply(BigDecimal.valueOf(income));

                    // Format to display as percentages (multiply by 100)
                    String formattedPercentage = adjustedPercentage.multiply(BigDecimal.valueOf(100))
                            .setScale(1, RoundingMode.HALF_UP) + "%";

                    // Format for dollar amount
                    String formattedAmount = "$" + amount.setScale(2, RoundingMode.HALF_UP);

                    // Format for original target (for comparison)
                    String originalTargetPercentage = originalPercentage.multiply(BigDecimal.valueOf(100))
                            .setScale(1, RoundingMode.HALF_UP) + "%";

                    // Display the category, percentage and amount
                    System.out.printf("%-12s %7s  (%s) - Target: %s%n",
                            category + ":", formattedPercentage, formattedAmount, originalTargetPercentage);

                    total = total.add(adjustedPercentage);
                }
            } else {
                System.out.println("No extra categories defined.");
            }
        } else {
            System.out.println("\nEXTRA CATEGORIES:");
            System.out.println("No budget remaining for extra categories after essentials and savings.");
        }

        // Display the total percentage
        System.out.println("-------------------------------------------------------");
        String formattedTotal = total.multiply(BigDecimal.valueOf(100)).setScale(1, RoundingMode.HALF_UP) + "%";
        System.out.println("Total:        " + formattedTotal);

        scanner.close();
    }

    /**
     * Helper method to display categories and calculate their total
     */
    private static BigDecimal displayCategories(PercentageCalculator calculator, double income, String[] categories) {
        BigDecimal categoryTotal = BigDecimal.ZERO;

        for (String category : categories) {
            BigDecimal percentage = calculator.estimateCategoryPercentage(income, category);
            BigDecimal amount = percentage.multiply(BigDecimal.valueOf(income));

            // Format to display as percentages (multiply by 100)
            String formattedPercentage = percentage.multiply(BigDecimal.valueOf(100))
                    .setScale(1, RoundingMode.HALF_UP) + "%";

            // Format for dollar amount
            String formattedAmount = "$" + amount.setScale(2, RoundingMode.HALF_UP);

            // Display the category, percentage and amount
            System.out.printf("%-12s %7s  (%s)%n", category + ":", formattedPercentage, formattedAmount);

            categoryTotal = categoryTotal.add(percentage);
        }

        return categoryTotal;
    }


}
