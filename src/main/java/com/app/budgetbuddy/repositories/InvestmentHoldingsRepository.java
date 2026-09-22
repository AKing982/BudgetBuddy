package com.app.budgetbuddy.repositories;


import com.app.budgetbuddy.entities.AccountEntity;
import com.app.budgetbuddy.entities.InvestmentHoldingsEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface InvestmentHoldingsRepository extends JpaRepository<InvestmentHoldingsEntity, Long>
{
    @Query("SELECT i FROM InvestmentHoldingsEntity i WHERE i.id IN :ids")
    List<InvestmentHoldingsEntity> findAllByIdIn(Set<Long> ids);

    @Query("SELECT i FROM InvestmentHoldingsEntity i WHERE i.account.user.id =:userId")
    List<InvestmentHoldingsEntity> findAllByUser(@Param("userId") Long id);

    @Query("SELECT i FROM InvestmentHoldingsEntity i WHERE i.account = :account AND i.securityId = :securityId")
    Optional<InvestmentHoldingsEntity> findByAccountAndSecurityId(@Param("account") AccountEntity account, @Param("securityId") String securityId);
}
