package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.PaymentSchedule;
import com.app.budgetbuddy.entities.EnvelopePaymentSchedulesEntity;
import com.app.budgetbuddy.entities.PaymentScheduleEntity;

import java.util.List;

public interface EnvelopePaymentSchedulesService extends ServiceModel<EnvelopePaymentSchedulesEntity>
{
    List<EnvelopePaymentSchedulesEntity> savePaymentSchedules(List<PaymentSchedule> paymentSchedules);
}
