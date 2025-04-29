package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.UserLogEntity;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
@Slf4j
@Setter
@Getter
public class TransactionRefreshService
{
    private final TransactionRefreshThreadService transactionRefreshThreadService;
    private final UserLogService userLogService;
    private Long currentUserId;
    private String cursor;

    @Autowired
    public TransactionRefreshService(UserLogService userLogService,
                                     TransactionRefreshThreadService transactionRefreshThreadService)
    {
        this.userLogService = userLogService;
        this.transactionRefreshThreadService = transactionRefreshThreadService;
    }

    @Scheduled(fixedRate=3600000)
    public void scheduleTransactionRefreshForUser()
    {
        try
        {
            Long userId = getCurrentUserId();
            if(userLogService.isUserActive(userId))
            {
                String cursor = getCursor();
                transactionRefreshThreadService.startTransactionSyncThread(userId, cursor);
                transactionRefreshThreadService.startRecurringTransactionSyncThread(userId);
            }
            else
            {
                log.info("User {} is not currently logged in and active.", userId);
            }
        }catch(IOException e){
            log.error("There was an error running the transaction refresh: ", e);
        }
    }
}
