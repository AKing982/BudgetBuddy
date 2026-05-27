package com.app.budgetbuddy.domain;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

@Getter
@Setter
@NoArgsConstructor(access = lombok.AccessLevel.PUBLIC)
@Builder
public class EnvelopeContribution
{
    private Long id;
    private Envelope envelope;
    private List<Contributions> contributions;

    public EnvelopeContribution(Long id, Envelope envelope, List<Contributions> contributions) {
        this.id = id;
        this.envelope = envelope;
        this.contributions = contributions;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        EnvelopeContribution that = (EnvelopeContribution) o;
        return Objects.equals(id, that.id) && Objects.equals(envelope, that.envelope) && Objects.equals(contributions, that.contributions);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, envelope, contributions);
    }
}
