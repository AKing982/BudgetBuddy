package com.app.budgetbuddy.entities;

import com.app.budgetbuddy.domain.CSVRule;
import com.app.budgetbuddy.domain.RuleType;
import jakarta.annotation.PostConstruct;
import jakarta.persistence.*;
import lombok.*;

import java.sql.Timestamp;

@Table(name="transactionRules")
@Entity
@Getter
@Setter
@Builder
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class TransactionRuleEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="userId")
    private UserEntity user;

    @Column(name="category")
    private String category;

    @Column(name="merchantRule")
    private String merchantRule;

    @Column(name="descriptionRule")
    private String descriptionRule;

    @Column(name="extendedDescriptionRule")
    private String extendedDescriptionRule;

    @Column(name="amountMin")
    private Double amountMin;

    @Column(name="amountMax")
    private Double amountMax;

    @Column(name="priority")
    private int priority;

    @Column(name="match_count")
    private int matchCount;

    @Column(name="isActive")
    private boolean isActive;

    @Column(name="date_created")
    private Timestamp dateCreated;

    @Column(name="date_modified")
    private Timestamp dateModified;

    @PrePersist
    void init() {
        dateModified = new Timestamp(System.currentTimeMillis());
        dateCreated = new Timestamp(System.currentTimeMillis());
    }

}
