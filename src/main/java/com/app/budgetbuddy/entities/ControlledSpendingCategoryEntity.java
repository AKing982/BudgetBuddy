package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name="budgetCategories")
@Data
@Builder
@NoArgsConstructor(access = AccessLevel.PUBLIC)
@AllArgsConstructor(access = AccessLevel.PUBLIC)
public class ControlledSpendingCategoryEntity
{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="budgetid")
    private BudgetEntity budget;

    @Column(name="categoryname")
    private String categoryName;

    @Column(name="allocatedamount")
    private Double allocatedAmount;

    @Column(name="monthlyspendinglimit")
    private Double monthlySpendingLimit;

    @Column(name="currentspending")
    private Double currentSpending;

    @Column(name="isfixedexpense")
    private Boolean isFixedExpense;

    @Column(name="isactive")
    private Boolean isActive;

    @Column(name="priority")
    private Integer priority;

    @Column(name="createdat")
    @Temporal(TemporalType.TIMESTAMP)
    private LocalDateTime createdAt;

    @Column(name="updatedat")
    @Temporal(TemporalType.TIMESTAMP)
    private LocalDateTime updatedAt;


}
