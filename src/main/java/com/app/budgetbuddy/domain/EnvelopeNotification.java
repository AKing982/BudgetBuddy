package com.app.budgetbuddy.domain;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Objects;

@Getter
@Setter
@NoArgsConstructor(access = lombok.AccessLevel.PUBLIC)
@AllArgsConstructor(access = lombok.AccessLevel.PUBLIC)
@Builder
public class EnvelopeNotification
{
    private Long id;
    private String envelopeName;
    private Long envelopeId;
    private EnvelopeType envelopeType;
    private String title;
    private String message;
    private EnvelopeStatus envelopeStatus;
    private boolean isRead;
    private BigDecimal amount;
    private LocalDate dateToContribute;

    public EnvelopeNotification(String envelopeName, Long envelopeId, EnvelopeType envelopeType, String title, String message, EnvelopeStatus envelopeStatus, boolean isRead, BigDecimal amount, LocalDate dateToContribute) {
        this.envelopeName = envelopeName;
        this.envelopeId = envelopeId;
        this.envelopeType = envelopeType;
        this.title = title;
        this.message = message;
        this.envelopeStatus = envelopeStatus;
        this.isRead = isRead;
        this.amount = amount;
        this.dateToContribute = dateToContribute;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        EnvelopeNotification that = (EnvelopeNotification) o;
        return isRead == that.isRead && Objects.equals(envelopeName, that.envelopeName) && Objects.equals(envelopeId, that.envelopeId) && envelopeType == that.envelopeType && Objects.equals(title, that.title) && Objects.equals(message, that.message) && envelopeStatus == that.envelopeStatus && Objects.equals(amount, that.amount) && Objects.equals(dateToContribute, that.dateToContribute);
    }

    @Override
    public int hashCode() {
        return Objects.hash(envelopeName, envelopeId, envelopeType, title, message, envelopeStatus, isRead, amount, dateToContribute);
    }
}
