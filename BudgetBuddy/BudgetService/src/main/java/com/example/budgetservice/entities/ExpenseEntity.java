package com.example.budgetservice.entities;

import com.example.budgetservice.CategoryType;
import jakarta.persistence.*;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;

@Table(name="expenses")
@Entity
@Data
@Builder
public class ExpenseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long expenseId;

    @Column(name="amount")
    private BigDecimal amount;

    @Column(name="categoryType")
    @Enumerated(EnumType.STRING)
    private CategoryType categoryType;

    @Column(name="description")
    private String description;

    @Column(name="expenseDate")
    private LocalDate expenseDate;

    @ManyToOne(fetch = FetchType.LAZY)
    private BudgetUserEntity budgetUser;

    @ManyToMany(mappedBy = "expenses")
    private Set<BudgetEntity> budgetEntitySet;

    public ExpenseEntity(Long expenseId, BigDecimal amount, CategoryType categoryType, String description, LocalDate expenseDate, BudgetUserEntity budgetUser, Set<BudgetEntity> budgetEntitySet) {
        this.expenseId = expenseId;
        this.amount = amount;
        this.categoryType = categoryType;
        this.description = description;
        this.expenseDate = expenseDate;
        this.budgetUser = budgetUser;
        this.budgetEntitySet = budgetEntitySet;
    }

    public ExpenseEntity() {

    }
}
