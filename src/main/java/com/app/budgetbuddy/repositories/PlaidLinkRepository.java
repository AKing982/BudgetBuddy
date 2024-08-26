package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.PlaidLinkEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PlaidLinkRepository extends JpaRepository<PlaidLinkEntity, Long>
{

}
