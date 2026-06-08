package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.PaymentPlan;
import com.app.budgetbuddy.entities.EnvelopeEntity;
import com.app.budgetbuddy.entities.EnvelopePaymentPlansEntity;
import com.app.budgetbuddy.repositories.EnvelopeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class PaymentPlanToEntityConverter implements Converter<PaymentPlan, EnvelopePaymentPlansEntity>
{
    private final EnvelopeRepository envelopeRepository;

    @Autowired
    public PaymentPlanToEntityConverter(EnvelopeRepository envelopeRepository)
    {
        this.envelopeRepository = envelopeRepository;
    }

    @Override
    public EnvelopePaymentPlansEntity convert(PaymentPlan paymentPlan)
    {
        if(paymentPlan == null)
        {
            throw new IllegalArgumentException("PaymentPlan cannot be null");
        }

        EnvelopeEntity envelopeEntity = envelopeRepository
                .findById(paymentPlan.getEnvelopeId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "No envelope found with id: " + paymentPlan.getEnvelopeId()));

        return EnvelopePaymentPlansEntity.builder()
                .envelope(envelopeEntity)
                .merchant(paymentPlan.getMerchant())
                .originalBalance(paymentPlan.getOriginalBalance() != null
                        ? paymentPlan.getOriginalBalance().doubleValue()
                        : 0.0)
                .initialPaid(paymentPlan.getCurrentPaid() != null
                        ? paymentPlan.getCurrentPaid().doubleValue()
                        : 0.0)
                .isPayInFour(paymentPlan.isPayInFour())
                .minimumPayment(paymentPlan.getMinimumPayment() != null
                        ? paymentPlan.getMinimumPayment().doubleValue()
                        : 0.0)
                .planDuration(paymentPlan.getPlanDuration())
                .totalPayments(paymentPlan.getTotalPayments())
                .initialPaymentDate(paymentPlan.getInitialPaymentDate())
                .dueDate(paymentPlan.getDueDate())
                .build();
    }
}
