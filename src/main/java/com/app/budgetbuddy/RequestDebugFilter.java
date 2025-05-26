package com.app.budgetbuddy;


import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpServletResponseWrapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.Collections;

public class RequestDebugFilter implements Filter
{
    private static final Logger logger = LoggerFactory.getLogger(RequestDebugFilter.class);

    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain) throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) servletRequest;
        HttpServletResponse res = (HttpServletResponse) servletResponse;

        // Log request details
        logger.info("=== REQUEST START ===");
        logger.info("Request URI: {} {}", req.getMethod(), req.getRequestURI());
        logger.info("Remote IP: {}", req.getRemoteAddr());

        // Log headers
        Collections.list(req.getHeaderNames()).forEach(headerName ->
                logger.info("Header '{}': {}", headerName, req.getHeader(headerName))
        );

        // Wrap response to intercept status code
        HttpServletResponseWrapper responseWrapper = new HttpServletResponseWrapper(res);

        try {
            filterChain.doFilter(servletRequest, responseWrapper);
        } finally {
            logger.info("=== RESPONSE START ===");
            logger.info("Response Status: {}", responseWrapper.getStatus());

            // Log response headers
            responseWrapper.getHeaderNames().forEach(headerName ->
                    logger.info("Response Header '{}': {}", headerName, responseWrapper.getHeader(headerName))
            );

            logger.info("=== REQUEST/RESPONSE END ===");
        }
    }
}
