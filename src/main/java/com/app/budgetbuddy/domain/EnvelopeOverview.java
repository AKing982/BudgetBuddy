package com.app.budgetbuddy.domain;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Objects;

@Getter
@Setter
@NoArgsConstructor(access= AccessLevel.PUBLIC)
public class EnvelopeOverview
{
    private Long envelopeId;
    private LocalDate targetDate;
    private BigDecimal allocated;
    private int days_left;
    private int streak;
    private BigDecimal remaining;

    public EnvelopeOverview(Long envelopeId, LocalDate targetDate, BigDecimal allocated, int days_left, int streak, BigDecimal remaining) {
        this.envelopeId = envelopeId;
        this.targetDate = targetDate;
        this.allocated = allocated;
        this.days_left = days_left;
        this.streak = streak;
        this.remaining = remaining;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        EnvelopeOverview that = (EnvelopeOverview) o;
        return days_left == that.days_left && streak == that.streak && Objects.equals(envelopeId, that.envelopeId) && Objects.equals(targetDate, that.targetDate) && Objects.equals(allocated, that.allocated) && Objects.equals(remaining, that.remaining);
    }

    @Override
    public int hashCode() {
        return Objects.hash(envelopeId, targetDate, allocated, days_left, streak, remaining);
    }
}
