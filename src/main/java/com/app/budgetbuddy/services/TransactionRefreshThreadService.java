package com.app.budgetbuddy.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@Async
@Slf4j
public class TransactionRefreshThreadService
{
    private int TOTAL_THREAD_COUNT = 12;

}
