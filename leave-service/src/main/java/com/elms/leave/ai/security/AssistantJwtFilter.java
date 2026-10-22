package com.elms.leave.ai.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Slf4j
@Component
@ConditionalOnProperty(prefix = "app.ai", name = "enabled", havingValue = "true")
public class AssistantJwtFilter extends OncePerRequestFilter {

    private final SecretKey signingKey;

    public AssistantJwtFilter(@Value("${jwt.secret}") String secret) {
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String authorization = request.getHeader("Authorization");
        if (StringUtils.hasText(authorization) && authorization.startsWith("Bearer ")) {
            String token = authorization.substring(7);
            try {
                Claims claims = Jwts.parserBuilder()
                        .setSigningKey(signingKey)
                        .build()
                        .parseClaimsJws(token)
                        .getBody();
                Object userIdObj = claims.get("userId");
                Long userId = userIdObj instanceof Number ? ((Number) userIdObj).longValue() : null;
                String role = claims.get("role", String.class);
                String email = claims.getSubject();
                if (userId != null && StringUtils.hasText(role) && StringUtils.hasText(email)) {
                    AssistantPrincipal principal = new AssistantPrincipal(userId, email, role);
                    var authentication = new UsernamePasswordAuthenticationToken(
                            principal, null, List.of(new SimpleGrantedAuthority("ROLE_" + role)));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                } else {
                    log.warn("JWT token missing required claims (userId={}, role={}, email={})", userId, role, email);
                    SecurityContextHolder.clearContext();
                }
            } catch (io.jsonwebtoken.ExpiredJwtException e) {
                log.warn("JWT token has expired: {}", e.getMessage());
                SecurityContextHolder.clearContext();
            } catch (JwtException | IllegalArgumentException | NullPointerException e) {
                log.warn("JWT validation failed: {}", e.getMessage());
                SecurityContextHolder.clearContext();
            }
        }
        filterChain.doFilter(request, response);
    }
}
