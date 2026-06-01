package com.app.budgetbuddy.domain;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.Objects;

@Getter
@Setter
@NoArgsConstructor(access= AccessLevel.PUBLIC)
public class EnvelopeBuildDetails
{
    private Envelope envelope;
    private EnvelopeLink linkedEnvelope;
    private String errorMessage;

    public EnvelopeBuildDetails(Envelope envelope, List<EnvelopeContribution> envelopeContributions, EnvelopeLink linkedEnvelope, String errorMessage) {
        this.envelope = envelope;
        this.linkedEnvelope = linkedEnvelope;
        this.errorMessage = errorMessage;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        EnvelopeBuildDetails that = (EnvelopeBuildDetails) o;
        return Objects.equals(envelope, that.envelope) && Objects.equals(linkedEnvelope, that.linkedEnvelope) && Objects.equals(errorMessage, that.errorMessage);
    }

    @Override
    public int hashCode() {
        return Objects.hash(envelope, linkedEnvelope, errorMessage);
    }
}
