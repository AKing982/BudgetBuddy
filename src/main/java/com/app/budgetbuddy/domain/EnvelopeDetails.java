package com.app.budgetbuddy.domain;

import lombok.*;

import java.util.List;
import java.util.Objects;

@Getter
@Setter
@NoArgsConstructor(access= AccessLevel.PUBLIC)
@Builder
public class EnvelopeDetails
{
    private Envelope envelope;
    private List<Contributions> contributions;
    private EnvelopeNotification envelopeNotification;
    private String errorMessage;

    public EnvelopeDetails(Envelope envelope, List<Contributions> contributions, EnvelopeNotification envelopeNotification, String errorMessage) {
        this.envelope = envelope;
        this.contributions = contributions;
        this.envelopeNotification = envelopeNotification;
        this.errorMessage = errorMessage;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        EnvelopeDetails that = (EnvelopeDetails) o;
        return Objects.equals(envelope, that.envelope) && Objects.equals(contributions, that.contributions) && Objects.equals(envelopeNotification, that.envelopeNotification) && Objects.equals(errorMessage, that.errorMessage);
    }

    @Override
    public int hashCode() {
        return Objects.hash(envelope, contributions, envelopeNotification, errorMessage);
    }
}
