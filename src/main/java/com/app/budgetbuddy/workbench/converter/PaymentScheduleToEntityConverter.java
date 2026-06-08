package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.PaymentSchedule;
import com.app.budgetbuddy.entities.EnvelopePaymentSchedulesEntity;
import com.app.budgetbuddy.entities.PaymentScheduleEntity;
import com.app.budgetbuddy.repositories.EnvelopePaymentPlansRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class PaymentScheduleToEntityConverter implements Converter<PaymentSchedule, EnvelopePaymentSchedulesEntity>
{
    private final EnvelopePaymentPlansRepository envelopePaymentPlansRepository;

    @Autowired
    public PaymentScheduleToEntityConverter(EnvelopePaymentPlansRepository envelopePaymentPlansRepository)
    {
        this.envelopePaymentPlansRepository = envelopePaymentPlansRepository;
    }

    @Override
    public EnvelopePaymentSchedulesEntity convert(PaymentSchedule paymentSchedule)
    {
        if(paymentSchedule == null)
        {
            return null;
        }
        return EnvelopePaymentSchedulesEntity.builder()
                .month(paymentSchedule.getDueDate() != null
                        ? paymentSchedule.getDueDate().getMonthValue()
                        : (paymentSchedule.getMonth() != null
                        ? paymentSchedule.getMonth().getMonthValue()
                        : 0))
                .year(paymentSchedule.getDueDate() != null
                        ? paymentSchedule.getDueDate().getYear()
                        : (paymentSchedule.getMonth() != null
                        ? paymentSchedule.getMonth().getYear()
                        : 0))
                .paymentAmount(paymentSchedule.getAmount() != null
                        ? paymentSchedule.getAmount().doubleValue()
                        : 0.0)
                .currentBalance(paymentSchedule.getBalance() != null
                        ? paymentSchedule.getBalance().doubleValue()
                        : 0.0)
                .status(paymentSchedule.getStatus())
                .dueDate(paymentSchedule.getDueDate())
                .paymentPlan(envelopePaymentPlansRepository.findById(paymentSchedule.getPaymentPlanId()).orElseThrow())
                .build();
    }
}
