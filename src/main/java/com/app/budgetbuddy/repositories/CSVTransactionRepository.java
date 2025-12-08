package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.CSVTransactionEntity;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface CSVTransactionRepository extends JpaRepository<CSVTransactionEntity, Long>
{
    @Query("SELECT ct FROM CSVTransactionEntity ct WHERE ct.transactionDate BETWEEN :startDate AND :endDate AND ct.csvAccount.id =:acctId")
    List<CSVTransactionEntity> findCSVTransactionEntitiesByAcctIdAndStartDateAndEndDate(@Param("acctId") Long acctId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
