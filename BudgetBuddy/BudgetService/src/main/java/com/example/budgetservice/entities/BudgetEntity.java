package com.example.budgetservice.entities;

import com.example.budgetservice.embedable.BudgetPeriod;
import jakarta.persistence.*;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

@Table(name="budgets")
@Entity
@Data
@Builder
public class BudgetEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="description")
    private String description;

    @Column(name="allocatedAmount")
    private BigDecimal allocatedAmount;

    @Column(name="budgetGoal")
    private BigDecimal budgetGoal;

    @Embedded
    private BudgetPeriod budgetPeriod;

    @ManyToOne(fetch = FetchType.LAZY)
    private BudgetUserEntity budgetUserEntity;

    @ManyToMany
    @JoinTable(name = "expense_budget",
            joinColumns = @JoinColumn(name = "budget_id"),
            inverseJoinColumns = @JoinColumn(name = "expense_id"))
    private Set<ExpenseEntity> expenses = new HashSet<>();

    public BudgetEntity(Long id, String description, BigDecimal allocatedAmount, BigDecimal budgetGoal, BudgetPeriod budgetPeriod, BudgetUserEntity budgetUserEntity, Set<ExpenseEntity> expenses) {
        this.id = id;
        this.description = description;
        this.allocatedAmount = allocatedAmount;
        this.budgetGoal = budgetGoal;
        this.budgetPeriod = budgetPeriod;
        this.budgetUserEntity = budgetUserEntity;
        this.expenses = expenses;
    }

    public BudgetEntity() {

    }
}
