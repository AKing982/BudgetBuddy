package com.app.budgetbuddy.domain;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor(access = lombok.AccessLevel.PUBLIC)
public class EnvelopeScore
{
    private Long envelopeId;
    private int score;

    public EnvelopeScore(Long envelopeId, int score)
    {
        this.envelopeId = envelopeId;
        this.score = score;
    }
}

