package com.app.budgetbuddy.controllers;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;

@RestController
@RequestMapping(value="/api/oauth")
@CrossOrigin(value="http://localhost:3000")
public class PlaidOAuthController {

    @GetMapping("/oauth-redirect")
    public RedirectView handleOAuthRedirect(@RequestParam(required = false) String oauth_state_id){
        String frontEndUrl = "http://localhost:3000/link?oauth_state_id="+oauth_state_id;
        return new RedirectView(frontEndUrl);
    }
}
