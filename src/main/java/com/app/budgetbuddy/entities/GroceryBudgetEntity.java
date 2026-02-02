package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name="groceryBudgets")
@Getter
@Setter
public class GroceryBudgetEntity
{
    @Id
    @GeneratedValue(strategy= GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="budgetScheduleRangeId")
    private BudgetScheduleRangeEntity budgetScheduleRange;

    @Column(name="week_number")
    private int weekNumber;

    @Column(name="startDate")
    private LocalDate startDate;

    @Column(name="endDate")
    private LocalDate endDate;

    @Column(name="budgeted_amount")
    private Double budgetedAmount;

    @Column(name="total_spent")
    private Double totalSpent;

    @Column(name="savings_goal")
    private Double savingsGoal;

    @Column(name="health")
    private Double health;

}
