package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.InvestmentTransactionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@Repository
public interface InvestmentTransactionRepository extends JpaRepository<InvestmentTransactionEntity, Long>
{
    @Query("SELECT i FROM InvestmentTransactionEntity i WHERE i.investmentTransactionId IN :incomingIds")
    List<InvestmentTransactionEntity> findAllByInvestmentTransactionIdIn(Set<String> incomingIds);

    @Query("SELECT i FROM InvestmentTransactionEntity i WHERE i.account.user.id =:userId AND i.date BETWEEN :startDate AND :endDate")
    List<InvestmentTransactionEntity> findAllByUserIdAndDateRange(@Param("userId") Long userId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
