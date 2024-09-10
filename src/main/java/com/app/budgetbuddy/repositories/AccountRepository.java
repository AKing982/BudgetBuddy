package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.AccountEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<AccountEntity, Long>
{
    @Query("SELECT a FROM AccountEntity a WHERE a.accountReferenceNumber =:acctID")
    Optional<AccountEntity> findByAccountId(@Param("acctID") String acctID);
}
