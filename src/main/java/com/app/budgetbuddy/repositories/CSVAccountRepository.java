package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.CSVAccountEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CSVAccountRepository extends JpaRepository<CSVAccountEntity, Long>
{
    @Query("SELECT c FROM CSVAccountEntity c WHERE c.suffix =:suffix AND c.user.id =:userId")
    Optional<CSVAccountEntity> findBySuffixAndUserId(int suffix, Long userId);

    @Query("SELECT c FROM CSVAccountEntity c WHERE c.user.id =:userId")
    Optional<CSVAccountEntity> findByUserId(Long userId);

    @Query("SELECT c FROM CSVAccountEntity c WHERE c.accountNumber =:acctNum AND c.suffix =:suffix")
    Optional<CSVAccountEntity> findByAcctNumAndSuffix(String acctNum, int suffix);

    @Query("SELECT CASE WHEN COUNT(c) > 0 THEN TRUE ELSE FALSE END FROM CSVAccountEntity c WHERE c.suffix =:suffix AND c.accountNumber =:acctNum AND c.user.id =:id")
    boolean existsBySuffixAccountNumberAndUserId(@Param("suffix") int suffix, @Param("acctNum") String accountNumber, @Param("id") Long userId);
}
