package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.PaymentPlan;
import com.app.budgetbuddy.entities.EnvelopePaymentPlansEntity;

public interface EnvelopePaymentPlansService extends ServiceModel<EnvelopePaymentPlansEntity>
{
    PaymentPlan savePaymentPlan(PaymentPlan paymentPlan);
}
