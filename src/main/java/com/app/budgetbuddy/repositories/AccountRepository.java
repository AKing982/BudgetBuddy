package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.AccountEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<AccountEntity, Long>
{
    @Query("SELECT a FROM AccountEntity a WHERE a.id =:acctID")
    Optional<AccountEntity> findByAccountId(@Param("acctID") String acctID);

    @Query("SELECT a FROM AccountEntity a WHERE a.user.id =:id")
    List<AccountEntity> findByUserId(@Param("id") Long id);

    @Query("SELECT a.user.id FROM AccountEntity a WHERE a.id =:id")
    Optional<Long> findUserIdByAccountId(@Param("id") String id);
}
