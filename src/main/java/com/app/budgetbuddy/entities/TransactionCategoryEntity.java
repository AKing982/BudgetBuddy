package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.*;
import org.jetbrains.annotations.NotNull;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name="transactionCategories")
@NoArgsConstructor(access = AccessLevel.PUBLIC)
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@Getter
@Setter
public class TransactionCategoryEntity
{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="budgetid")
    private BudgetEntity budget;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="categoryid")
    private CategoryEntity category;

    @Column(name="budgetedAmount")
    @NotNull
    private Double budgetedAmount;

    @Column(name="actual")
    @NotNull
    private Double actual;

    @Column(name="isactive")
    private Boolean isactive;

    @Column(name="startDate")
    private LocalDate startDate;

    @Column(name="endDate")
    private LocalDate endDate;

    @Column(name="createdat")
    @Temporal(TemporalType.TIMESTAMP)
    private LocalDateTime createdat;

    @Column(name="updatedat")
    @Temporal(TemporalType.TIMESTAMP)
    private LocalDateTime updatedat;
}
