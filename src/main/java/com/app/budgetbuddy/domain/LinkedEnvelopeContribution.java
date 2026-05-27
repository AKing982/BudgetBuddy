package com.app.budgetbuddy.domain;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;

@Getter
@Setter
@NoArgsConstructor(access = lombok.AccessLevel.PUBLIC)
@Deprecated
public class LinkedEnvelopeContribution
{
    private EnvelopeLink envelopeLink;
    private List<EnvelopeContribution> envelopeContributions;
    private BigDecimal totalAmount;
    private BigDecimal totalContributed;

    public LinkedEnvelopeContribution(EnvelopeLink envelopeLink, List<EnvelopeContribution> envelopeContributions, BigDecimal totalAmount, BigDecimal totalContributed) {
        this.envelopeLink = envelopeLink;
        this.envelopeContributions = envelopeContributions;
        this.totalAmount = totalAmount;
        this.totalContributed = totalContributed;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        LinkedEnvelopeContribution that = (LinkedEnvelopeContribution) o;
        return Objects.equals(envelopeLink, that.envelopeLink) && Objects.equals(envelopeContributions, that.envelopeContributions) && Objects.equals(totalAmount, that.totalAmount) && Objects.equals(totalContributed, that.totalContributed);
    }

    @Override
    public int hashCode() {
        return Objects.hash(envelopeLink, envelopeContributions, totalAmount, totalContributed);
    }
}
