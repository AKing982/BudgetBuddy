package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.jetbrains.annotations.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Table(name="budgets")
@Entity
@Data
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class BudgetEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="budgetId")
    private Long id;

    @NotNull
    @Column(name="budgetName")
    private String budgetName;

    @NotNull
    @Column(name="budgetDescription")
    private String budgetDescription;

    @NotNull
    @Column(name="budgetAmount")
    private BigDecimal budgetAmount;

    @NotNull
    @Column(name="remainingAmount")
    private BigDecimal remainingAmount;

    @Column(name="actual")
    private BigDecimal actual;

    @Column(name="startDate")
    private LocalDate startDate;

    @Column(name="endDate")
    private LocalDate endDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="userid")
    private UserEntity user;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name="createdDate")
    private LocalDateTime createdDate;

    @OneToMany(fetch = FetchType.LAZY)
    @JoinColumn(name="budgets")
    private Set<TransactionsEntity> transactions = new HashSet<>();
}
