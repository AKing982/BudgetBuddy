package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Data;
import lombok.NoArgsConstructor;

@Table(name="recurringTransactionsLink")
@Entity
@Data
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class RecurringTransactionsLink
{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="rId")
    private RecurringTransactionEntity recurringTransaction;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="transactionId")
    private TransactionsEntity transaction;

    public RecurringTransactionsLink(RecurringTransactionEntity recurringTransaction, TransactionsEntity transaction){
        this.recurringTransaction = recurringTransaction;
        this.transaction = transaction;
    }


}
