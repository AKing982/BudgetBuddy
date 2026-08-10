package com.app.budgetbuddy.domain;

import lombok.*;

import java.util.List;
import java.util.Objects;

@Getter
@Setter
@NoArgsConstructor(access= AccessLevel.PUBLIC)
public class EnvelopeBuildDetails
{
    private List<Envelope> envelopes;
    private EnvelopeLink linkedEnvelope;
    private String errorMessage;

    public EnvelopeBuildDetails(List<Envelope> envelopes, List<EnvelopeContribution> envelopeContributions, EnvelopeLink linkedEnvelope, String errorMessage) {
        this.envelopes = envelopes;
        this.linkedEnvelope = linkedEnvelope;
        this.errorMessage = errorMessage;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        EnvelopeBuildDetails that = (EnvelopeBuildDetails) o;
        return Objects.equals(envelopes, that.envelopes) && Objects.equals(linkedEnvelope, that.linkedEnvelope) && Objects.equals(errorMessage, that.errorMessage);
    }

    @Override
    public int hashCode() {
        return Objects.hash(envelopes, linkedEnvelope, errorMessage);
    }
}
