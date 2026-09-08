package com.app.budgetbuddy.workbench.envelopes;

import com.app.budgetbuddy.domain.EnvelopeOverview;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.services.EnvelopeService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
@Slf4j
public class EnvelopeOverviewService
{
    private final EnvelopeService envelopeService;

    @PersistenceContext
    private final EntityManager entityManager;

    @Autowired
    public EnvelopeOverviewService(EnvelopeService envelopeService, EntityManager entityManager)
    {
        this.envelopeService = envelopeService;
        this.entityManager = entityManager;
    }

    public List<EnvelopeOverview> loadEnvelopeOverviewDetails(final Long envelopeId)
    {
        if(envelopeId == null)
        {
            return Collections.emptyList();
        }
        try
        {

        }catch(DataAccessException e){
            log.error("There was an error retrieving the envelope overview details: ", e);
            return Collections.emptyList();
        }
        return Collections.emptyList();
    }

}
