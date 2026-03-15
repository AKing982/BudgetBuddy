package com.app.budgetbuddy.controllers;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/plaid/webhook")
@Slf4j
public class PlaidWebHookController
{
//    private final PlaidWebHookService plaidWebHookService;
//
//    @Autowired
//    public PlaidWebHookController(PlaidWebHookService plaidWebHookService)
//    {
//        this.plaidWebHookService = plaidWebHookService;
//    }
//
//    @PostMapping("/webhook")
//    public ResponseEntity<Void> handleWebhook(@RequestBody Map<String, Object> payload) {
//        String webhookType = (String) payload.get("webhook_type");
//        String webhookCode = (String) payload.get("webhook_code");
//
//        log.info("Received Plaid webhook: type={}, code={}", webhookType, webhookCode);
//
//        if("TRANSACTIONS".equals(webhookType))
//        {
//            switch (webhookCode) {
//                case "SYNC_UPDATES_AVAILABLE" -> {
//                    String itemId = (String) payload.get("item_id");
//                    transactionSyncService.syncTransactionsForItem(itemId);
//                }
//                case "INITIAL_UPDATE", "HISTORICAL_UPDATE" -> {
//                    String itemId = (String) payload.get("item_id");
//                    transactionSyncService.syncTransactionsForItem(itemId);
//                }
//                default -> log.debug("Unhandled webhook code: {}", webhookCode);
//            }
//        }
//
//        return ResponseEntity.ok().build();
//    }
}
