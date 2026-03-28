package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name="bp_account_balances")
@Getter
@Setter
@Builder
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class BPAccountBalanceEntity
{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="bp_template_detail_id")
    private BPTemplateDetailEntity bpTemplateDetail;

    @Column(name="account_id")
    private String accountId;

    @Column(name="row_index")
    private int rowIndex;

    @Column(name="start_date")
    private LocalDate startDate;

    @Column(name="end_date")
    private LocalDate endDate;

    @Column(name="current_balance", precision = 19, scale = 4)
    private BigDecimal currentBalance;

    @Column(name="planned_balance", precision = 19, scale = 4)
    private BigDecimal plannedBalance;

    @Column(name="available_balance", precision = 19, scale = 4)
    private BigDecimal availableBalance;
}
