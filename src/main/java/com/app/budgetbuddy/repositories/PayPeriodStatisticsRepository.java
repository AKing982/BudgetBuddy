package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.PayPeriodStatisticsEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PayPeriodStatisticsRepository extends JpaRepository<PayPeriodStatisticsEntity, Long>
{

}
