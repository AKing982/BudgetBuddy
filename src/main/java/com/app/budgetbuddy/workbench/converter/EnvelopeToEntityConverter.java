package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.Envelope;
import com.app.budgetbuddy.domain.EnvelopeContribution;
import com.app.budgetbuddy.domain.SubBudget;
import com.app.budgetbuddy.entities.EnvelopeContributionsEntity;
import com.app.budgetbuddy.entities.EnvelopeEntity;
import com.app.budgetbuddy.entities.SubBudgetEntity;
import com.app.budgetbuddy.repositories.SubBudgetRepository;
import com.app.budgetbuddy.repositories.UserRepository;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class EnvelopeToEntityConverter implements Converter<Envelope, EnvelopeEntity>
{
    private final SubBudgetRepository subBudgetRepository;
    private final UserRepository userRepository;
    private final EnvelopeContributionsToEntityConverter envelopeContributionsToEntityConverter;

    public EnvelopeToEntityConverter(SubBudgetRepository subBudgetRepository,
                                     UserRepository userRepository,
                                     EnvelopeContributionsToEntityConverter envelopeContributionsToEntityConverter)
    {
        this.subBudgetRepository = subBudgetRepository;
        this.userRepository = userRepository;
        this.envelopeContributionsToEntityConverter = envelopeContributionsToEntityConverter;
    }

    @Override
    public EnvelopeEntity convert(Envelope envelope)
    {
        if(envelope == null)
        {
            return null;
        }
        List<SubBudget> subBudgets = envelope.getSubBudgets();

        EnvelopeEntity entity = new EnvelopeEntity();
        if(subBudgets != null && !subBudgets.isEmpty())
        {
            List<Long> subBudgetIds = subBudgets.stream().map(SubBudget::getId).toList();
            Set<SubBudgetEntity> subBudgetEntities = new HashSet<>(subBudgetRepository.findAllById(subBudgetIds));
            entity.setSubBudgets(subBudgetEntities);
        }
        entity.setId(envelope.getId());
        entity.setName(envelope.getEnvelopeName());
        entity.setLinked(envelope.isLinked());
//        entity.setGoal(envelope.getGoal());
        entity.setType(envelope.getEnvelopeType());
        entity.setDuration(envelope.getDuration());
        entity.setTargetDate(envelope.getTargetDate());
        entity.setStartDate(envelope.getStartDate());
        entity.setUser(userRepository.findById(envelope.getUserId()).orElse(null));
        entity.setBudgeted(envelope.getBudgeted().doubleValue());
        entity.setCurrentlySaved(envelope.getCurrentSaved().doubleValue());
        entity.setTargetAmount(envelope.getTargetAmount().doubleValue());
        entity.setFrequency(envelope.getFrequency() != null ? envelope.getFrequency() : " ");
        if(envelope.getContributions() != null && !envelope.getContributions().isEmpty())
        {
            List<EnvelopeContributionsEntity> contributionEntities = envelope.getContributions().stream()
                    .map(contribution -> envelopeContributionsToEntityConverter.convert(
                            EnvelopeContribution.builder()
                                    .envelope(envelope)
                                    .contributions(List.of(contribution))
                                    .build()
                    ))
                    .collect(Collectors.toList());
            entity.setContributions(contributionEntities);
        }
        entity.setActive(envelope.isActive());
        entity.setContributionMode("AUTO");
        entity.setStatus(envelope.getStatus());
        entity.setPriority(envelope.getPriority());
        return entity;
    }
}
