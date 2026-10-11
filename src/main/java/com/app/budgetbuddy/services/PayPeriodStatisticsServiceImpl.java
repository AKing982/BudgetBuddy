package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.PayPeriodStatisticsEntity;
import com.app.budgetbuddy.repositories.PayPeriodStatisticsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Service
public class PayPeriodStatisticsServiceImpl implements PayPeriodStatisticsService
{
    private final PayPeriodStatisticsRepository payPeriodStatisticsRepository;

    @Autowired
    public PayPeriodStatisticsServiceImpl(PayPeriodStatisticsRepository payPeriodStatisticsRepository)
    {
        this.payPeriodStatisticsRepository = payPeriodStatisticsRepository;
    }

    @Override
    public Collection<PayPeriodStatisticsEntity> findAll() {
        return List.of();
    }

    @Override
    public void save(PayPeriodStatisticsEntity payPeriodStatisticsEntity) {

    }

    @Override
    public void delete(PayPeriodStatisticsEntity payPeriodStatisticsEntity) {

    }

    @Override
    public Optional<PayPeriodStatisticsEntity> findById(Long id) {
        return Optional.empty();
    }
}
