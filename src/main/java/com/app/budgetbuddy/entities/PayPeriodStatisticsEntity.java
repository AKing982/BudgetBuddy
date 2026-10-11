package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.Objects;

@Entity
@Table(name="payPeriodStatistics")
@Getter
@Setter
@Builder
@NoArgsConstructor(access = lombok.AccessLevel.PUBLIC)
public class PayPeriodStatisticsEntity
{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="subBudgetId")
    private SubBudgetEntity subBudget;

    @Column(name="start_date")
    private LocalDate startDate;

    @Column(name="end_date")
    private LocalDate endDate;

    @Column(name="income_amount")
    private Double incomeAmount;

    @Column(name="total_spent")
    private Double totalSpent;

    @Column(name="total_bills")
    private Double totalBills;

    @Column(name="total_recurring")
    private Double totalRecurring;

    @Column(name="total_savings")
    private Double totalSavings;

    @Column(name="income_days_left")
    private Integer incomeDaysLeft;

    @Column(name="spending_per_day")
    private Double spendingPerDay;

    public PayPeriodStatisticsEntity(Long id, SubBudgetEntity subBudget, LocalDate startDate, LocalDate endDate, Double incomeAmount, Double totalSpent, Double totalBills, Double totalRecurring, Double totalSavings, Integer incomeDaysLeft, Double spendingPerDay) {
        this.id = id;
        this.subBudget = subBudget;
        this.startDate = startDate;
        this.endDate = endDate;
        this.incomeAmount = incomeAmount;
        this.totalSpent = totalSpent;
        this.totalBills = totalBills;
        this.totalRecurring = totalRecurring;
        this.totalSavings = totalSavings;
        this.incomeDaysLeft = incomeDaysLeft;
        this.spendingPerDay = spendingPerDay;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        PayPeriodStatisticsEntity that = (PayPeriodStatisticsEntity) o;
        return Objects.equals(id, that.id) && Objects.equals(subBudget, that.subBudget) && Objects.equals(startDate, that.startDate) && Objects.equals(endDate, that.endDate) && Objects.equals(incomeAmount, that.incomeAmount) && Objects.equals(totalSpent, that.totalSpent) && Objects.equals(totalBills, that.totalBills) && Objects.equals(totalRecurring, that.totalRecurring) && Objects.equals(totalSavings, that.totalSavings) && Objects.equals(incomeDaysLeft, that.incomeDaysLeft) && Objects.equals(spendingPerDay, that.spendingPerDay);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, subBudget, startDate, endDate, incomeAmount, totalSpent, totalBills, totalRecurring, totalSavings, incomeDaysLeft, spendingPerDay);
    }

    @Override
    public String toString() {
        return "PayPeriodStatisticsEntity{" +
                "id=" + id +
                ", subBudget=" + subBudget +
                ", startDate=" + startDate +
                ", endDate=" + endDate +
                ", incomeAmount=" + incomeAmount +
                ", totalSpent=" + totalSpent +
                ", totalBills=" + totalBills +
                ", totalRecurring=" + totalRecurring +
                ", totalSavings=" + totalSavings +
                ", incomeDaysLeft=" + incomeDaysLeft +
                ", spendingPerDay=" + spendingPerDay +
                '}';
    }

    public double getRemaining(){
        if(incomeAmount == null || totalSpent == null || totalRecurring == null || totalBills == null){
            return 0;
        }
        return incomeAmount - totalSpent - totalRecurring - totalBills;
    }
}
