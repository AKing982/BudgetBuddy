package com.app.budgetbuddy.domain;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Objects;

@Getter
@Setter
@NoArgsConstructor(access = lombok.AccessLevel.PUBLIC)
@Builder
public class PaymentInfo
{
    private int numberOfPayments;
    private int totalMonths;
    private double totalAmount;
    private LocalDate endDate;
    private LocalDate firstPaymentDate;
    private BigDecimal firstPaymentAmount;
    private boolean isPayInFour;
    private String merchant;
    private String description;

    public PaymentInfo(int numberOfPayments, int totalMonths, double totalAmount, LocalDate endDate, LocalDate firstPaymentDate, BigDecimal firstPaymentAmount, boolean isPayInFour, String merchant, String description) {
        this.numberOfPayments = numberOfPayments;
        this.totalMonths = totalMonths;
        this.totalAmount = totalAmount;
        this.endDate = endDate;
        this.firstPaymentDate = firstPaymentDate;
        this.firstPaymentAmount = firstPaymentAmount;
        this.isPayInFour = isPayInFour;
        this.merchant = merchant;
        this.description = description;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        PaymentInfo that = (PaymentInfo) o;
        return numberOfPayments == that.numberOfPayments && totalMonths == that.totalMonths && Double.compare(totalAmount, that.totalAmount) == 0 && isPayInFour == that.isPayInFour && Objects.equals(endDate, that.endDate) && Objects.equals(firstPaymentDate, that.firstPaymentDate) && Objects.equals(firstPaymentAmount, that.firstPaymentAmount) && Objects.equals(merchant, that.merchant) && Objects.equals(description, that.description);
    }

    @Override
    public int hashCode() {
        return Objects.hash(numberOfPayments, totalMonths, totalAmount, endDate, firstPaymentDate, firstPaymentAmount, isPayInFour, merchant, description);
    }
}
