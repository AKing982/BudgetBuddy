package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.PlaidTransactionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PlaidTransactionRepository extends JpaRepository<PlaidTransactionEntity, Long>
{

}
