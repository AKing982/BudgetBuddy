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
    private static final double MIN_INCOME = 0.0;
    private static final double MAX_INCOME = 10000.0;

    // GROCERY: High percentage at low income, decreasing as income increases
    private static final BigDecimal GROCERY_SLOPE = BigDecimal.valueOf(-0.000007);  // Decrease by 0.7% per $1000
    private static final BigDecimal GROCERY_INTERCEPT = BigDecimal.valueOf(0.12);   // Start at 12% for low income

    // OTHER_PURCHASES: Low percentage at low income, increasing as income increases
    private static final BigDecimal OTHER_PURCHASES_SLOPE = BigDecimal.valueOf(0.000007);  // Increase by 0.7% per $1000
    private static final BigDecimal OTHER_PURCHASES_INTERCEPT = BigDecimal.valueOf(0.03);  // Start at 3% for low income

    // RENT: High percentage at low income, decreasing as income increases
    private static final BigDecimal RENT_SLOPE = BigDecimal.valueOf(-0.004);        // Decrease by 4% per $1000
    private static final BigDecimal RENT_INTERCEPT = BigDecimal.valueOf(0.70);      // Start at 70% for low income

    // UTILITIES: Slight decrease as income increases
    private static final BigDecimal UTILITIES_SLOPE = BigDecimal.valueOf(-0.000015); // Decrease by 0.15% per $1000
    private static final BigDecimal UTILITIES_INTERCEPT = BigDecimal.valueOf(0.06);  // Start at 6% for low income

    // ORDER_OUT: Increases as income increases
    private static final BigDecimal ORDER_OUT_SLOPE = BigDecimal.valueOf(0.000007);  // Increase by 0.7% per $1000
    private static final BigDecimal ORDER_OUT_INTERCEPT = BigDecimal.valueOf(0.03);  // Start at 3% for low income

    // SUBSCRIPTION: Decreases as income increases
    private static final BigDecimal SUBSCRIPTION_SLOPE = BigDecimal.valueOf(-0.000009); // Decrease by 0.9% per $1000
    private static final BigDecimal SUBSCRIPTION_INTERCEPT = BigDecimal.valueOf(0.10);  // Start at 10% for low income

    // GAS_FUEL: Slight increase then decrease
    private static final BigDecimal GAS_FUEL_SLOPE = BigDecimal.valueOf(0.0000005);  // Very slight increase per $1000
    private static final BigDecimal GAS_FUEL_INTERCEPT = BigDecimal.valueOf(0.01);   // Start at 1% for low income

    // INSURANCE: Decreases as income increases
    private static final BigDecimal INSURANCE_SLOPE = BigDecimal.valueOf(-0.000008);  // Decrease by 0.8% per $1000
    private static final BigDecimal INSURANCE_INTERCEPT = BigDecimal.valueOf(0.10);   // Start at 10% for low income

    // PAYMENTS: Decreases as income increases
    private static final BigDecimal PAYMENTS_SLOPE = BigDecimal.valueOf(-0.000014);   // Decrease by 1.4% per $1000
    private static final BigDecimal PAYMENTS_INTERCEPT = BigDecimal.valueOf(0.20);    // Start at 20% for low income

    // SAVINGS: Increases as income increases
    private static final BigDecimal SAVINGS_SLOPE = BigDecimal.valueOf(0.000014);     // Increase by 1.4% per $1000
    private static final BigDecimal SAVINGS_INTERCEPT = BigDecimal.valueOf(0.05);     // Start at 5% for low income

    // TRIPS: Increases as income increases (luxury that becomes more affordable)
    private static final BigDecimal TRIPS_SLOPE = BigDecimal.valueOf(0.000008);       // Increase by 0.8% per $1000
    private static final BigDecimal TRIPS_INTERCEPT = BigDecimal.valueOf(0.01);       // Start at 1% for low income

    // HAIRCUT: Slight increase as income increases (more premium services)
    private static final BigDecimal HAIRCUT_SLOPE = BigDecimal.valueOf(0.000002);     // Increase by 0.2% per $1000
    private static final BigDecimal HAIRCUT_INTERCEPT = BigDecimal.valueOf(0.01);     // Start at 1% for low income

    // COFFEE: Slight increase as income increases (more premium coffee)
    private static final BigDecimal COFFEE_SLOPE = BigDecimal.valueOf(0.000003);      // Increase by 0.3% per $1000
    private static final BigDecimal COFFEE_INTERCEPT = BigDecimal.valueOf(0.01);      // Start at 1% for low income


    /**
     * Calculates a percentage based on income using linear scaling
     * @param incomeAmount The monthly income
     * @param slope The rate of change of percentage per dollar of income
     * @param intercept The base percentage at minimum income
     * @return The calculated percentage as a BigDecimal
     */
    public BigDecimal calculateLinearPercentage(final double incomeAmount,
                                                final BigDecimal slope,
                                                final BigDecimal intercept) {
        if (incomeAmount <= MIN_INCOME) {
            return intercept;
        }

        // Apply constraints to income for calculation
        double calculationIncome = Math.min(incomeAmount, MAX_INCOME);

        // Calculate percentage using linear function: percentage = slope * income + intercept
        BigDecimal incomeEffect = slope.multiply(BigDecimal.valueOf(calculationIncome));
        BigDecimal percentage = intercept.add(incomeEffect);

        // Ensure percentage is between 0 and 1
        if (percentage.compareTo(BigDecimal.ZERO) < 0) {
            return BigDecimal.ZERO;
        } else if (percentage.compareTo(BigDecimal.ONE) > 0) {
            return BigDecimal.ONE;
        }

        return percentage.setScale(4, RoundingMode.HALF_UP);
    }

    public BigDecimal getPaymentsPercentage(double incomeAmount) {
        return calculateLinearPercentage(incomeAmount, PAYMENTS_SLOPE, PAYMENTS_INTERCEPT);
    }

    public BigDecimal getInsurancePercentage(double incomeAmount) {
        return calculateLinearPercentage(incomeAmount, INSURANCE_SLOPE, INSURANCE_INTERCEPT);
    }

    public BigDecimal getGroceryPercentage(double incomeAmount) {
        return calculateLinearPercentage(incomeAmount, GROCERY_SLOPE, GROCERY_INTERCEPT);
    }

    public BigDecimal getGasFuelPercentage(double incomeAmount) {
        return calculateLinearPercentage(incomeAmount, GAS_FUEL_SLOPE, GAS_FUEL_INTERCEPT);
    }

    public BigDecimal getRentPercentage(double incomeAmount) {
        return calculateLinearPercentage(incomeAmount, RENT_SLOPE, RENT_INTERCEPT);
    }

    public BigDecimal getUtilitiesPercentage(double incomeAmount) {
        return calculateLinearPercentage(incomeAmount, UTILITIES_SLOPE, UTILITIES_INTERCEPT);
    }

    public BigDecimal getOrderOutPercentage(double incomeAmount) {
        return calculateLinearPercentage(incomeAmount, ORDER_OUT_SLOPE, ORDER_OUT_INTERCEPT);
    }

    public BigDecimal getSubscriptionPercentage(double incomeAmount) {
        return calculateLinearPercentage(incomeAmount, SUBSCRIPTION_SLOPE, SUBSCRIPTION_INTERCEPT);
    }

    public BigDecimal getSavingsPercentage(double incomeAmount)
    {
        return calculateLinearPercentage(incomeAmount, SAVINGS_SLOPE, SAVINGS_INTERCEPT);
    }

    public BigDecimal getOtherPurchasesPercentage(double incomeAmount) {
        return calculateLinearPercentage(incomeAmount, OTHER_PURCHASES_SLOPE, OTHER_PURCHASES_INTERCEPT);
    }

    public BigDecimal getTripsPercentage(double incomeAmount) {
        return calculateLinearPercentage(incomeAmount, TRIPS_SLOPE, TRIPS_INTERCEPT);
    }

    public BigDecimal getHaircutPercentage(double incomeAmount) {
        return calculateLinearPercentage(incomeAmount, HAIRCUT_SLOPE, HAIRCUT_INTERCEPT);
    }

    public BigDecimal getCoffeePercentage(double incomeAmount) {
        return calculateLinearPercentage(incomeAmount, COFFEE_SLOPE, COFFEE_INTERCEPT);
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
            case "Trip":
                return getTripsPercentage(incomeAmount);
            case "Haircut":
                return getHaircutPercentage(incomeAmount);
            case "Coffee":
                return getCoffeePercentage(incomeAmount);
            default:
                throw new RuntimeException("Invalid category: " + category);
        }
    }

    public static void main(String[] args) {
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
        String[] extraCategories = {"Order Out", "Subscription", "Payments", "Other", "Trips", "Haircut", "Coffee"};

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
