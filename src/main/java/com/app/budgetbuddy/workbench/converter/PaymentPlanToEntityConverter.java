package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.PaymentPlan;
import com.app.budgetbuddy.entities.EnvelopePaymentPlansEntity;
import org.springframework.stereotype.Component;

@Component
public class PaymentPlanToEntityConverter implements Converter<PaymentPlan, EnvelopePaymentPlansEntity>
{

    @Override
    public EnvelopePaymentPlansEntity convert(PaymentPlan paymentPlan)
    {
        if(paymentPlan == null)
        {
            throw new IllegalArgumentException("PaymentPlan cannot be null");
        }

        EnvelopePaymentPlansEntity entity = new EnvelopePaymentPlansEntity();
        entity.setOriginalBalance(
                paymentPlan.getOriginalBalance() != null
                        ? paymentPlan.getOriginalBalance().doubleValue()
                        : 0.0
        );
        entity.setIntialPaid(
                paymentPlan.getCurrentPaid() != null
                        ? paymentPlan.getCurrentPaid().doubleValue()
                        : 0.0
        );
        entity.setMinimumPayment(
                paymentPlan.getMinimumPayment() != null
                        ? paymentPlan.getMinimumPayment().doubleValue()
                        : 0.0
        );
        entity.setDueDate(paymentPlan.getDueDate());
        return entity;
    }
}
