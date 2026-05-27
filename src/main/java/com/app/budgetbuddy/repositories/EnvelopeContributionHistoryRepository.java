package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.EnvelopeContributionHistoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EnvelopeContributionHistoryRepository extends JpaRepository<EnvelopeContributionHistoryEntity, Long>
{
}
