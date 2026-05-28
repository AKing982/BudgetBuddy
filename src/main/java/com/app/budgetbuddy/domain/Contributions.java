package com.app.budgetbuddy.domain;

import lombok.*;

import java.time.LocalDate;
import java.util.Objects;

@Getter
@Setter
@NoArgsConstructor(access = lombok.AccessLevel.PUBLIC)
@Builder
public class Contributions
{
    private Long id;
    private LocalDate scheduledDate;
    private LocalDate contributionDate;
    private String merchant;
    private double amount;
    private String status;
    private String frequency;

    public Contributions(Long id, LocalDate scheduledDate, LocalDate contributionDate, String merchant, double amount, String status, String frequency) {
        this.id = id;
        this.scheduledDate = scheduledDate;
        this.contributionDate = contributionDate;
        this.merchant = merchant;
        this.amount = amount;
        this.status = status;
        this.frequency = frequency;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        Contributions that = (Contributions) o;
        return Double.compare(amount, that.amount) == 0 && Objects.equals(id, that.id) && Objects.equals(scheduledDate, that.scheduledDate) && Objects.equals(contributionDate, that.contributionDate) && Objects.equals(merchant, that.merchant) && Objects.equals(status, that.status) && Objects.equals(frequency, that.frequency);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, scheduledDate, contributionDate, merchant, amount, status, frequency);
    }
}
