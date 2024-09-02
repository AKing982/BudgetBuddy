package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.TransactionsEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TransactionRepository extends JpaRepository<TransactionsEntity, Long> {
}
