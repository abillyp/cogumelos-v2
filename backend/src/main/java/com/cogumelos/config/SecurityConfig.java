/*
 * Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
 * Todos os direitos reservados.
 *
 * Este arquivo é parte do sistema cogumelos.app e está protegido pela
 * Lei Brasileira de Direitos Autorais (Lei nº 9.610/1998).
 * Uso, cópia ou distribuição não autorizados são expressamente proibidos.
 *
 * Contato: contato@cogumelos.app
 */

package com.cogumelos.config;

import com.cogumelos.security.CookieOAuth2RequestRepository;
import com.cogumelos.security.JwtFilter;
import com.cogumelos.security.OAuth2SuccessHandler;
import com.cogumelos.security.TrialFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtFilter jwtFilter;
    private final TrialFilter trialFilter;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;
    private final CookieOAuth2RequestRepository cookieOAuth2RequestRepository;

    public SecurityConfig(JwtFilter jwtFilter,
                          TrialFilter trialFilter,
                          OAuth2SuccessHandler oAuth2SuccessHandler,
                          CookieOAuth2RequestRepository cookieOAuth2RequestRepository) {
        this.jwtFilter                   = jwtFilter;
        this.trialFilter                 = trialFilter;
        this.oAuth2SuccessHandler        = oAuth2SuccessHandler;
        this.cookieOAuth2RequestRepository = cookieOAuth2RequestRepository;
    }

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(c -> c.disable())
                .cors(c -> c.configurationSource(corsSource()))
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) ->
                                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Não autenticado"))
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/api/auth/**",
                                "/oauth2/**",
                                "/actuator/health"
                        ).permitAll()
                        .requestMatchers(HttpMethod.POST,   "/api/insumos/**").hasRole("ADMIN_TENANT")
                        .requestMatchers(HttpMethod.PUT,    "/api/insumos/**").hasRole("ADMIN_TENANT")
                        .requestMatchers(HttpMethod.DELETE, "/api/insumos/**").hasRole("ADMIN_TENANT")
                        .requestMatchers("/api/insumos/**", "/api/especies/**").authenticated()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN_TENANT")
                        .anyRequest().authenticated()
                )
                .oauth2Login(oauth -> oauth
                        .authorizationEndpoint(ae -> ae
                                .baseUri("/oauth2/authorization")
                                .authorizationRequestRepository(cookieOAuth2RequestRepository)
                        )
                        .redirectionEndpoint(re -> re
                                .baseUri("/api/auth/oauth2/callback/*")
                        )
                        .successHandler(oAuth2SuccessHandler)
                )
                .addFilterBefore(jwtFilter,  UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(trialFilter, JwtFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsSource() {
        CorsConfiguration cfg = new CorsConfiguration();
        // Em produção: substitua pela URL real do frontend
        String frontendUrl = System.getenv("FRONTEND_URL") != null
                ? System.getenv("FRONTEND_URL")
                : "http://localhost:3000";
        cfg.setAllowedOriginPatterns(List.of(frontendUrl));
        cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        cfg.setAllowedHeaders(List.of("*"));
        cfg.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource src = new UrlBasedCorsConfigurationSource();
        src.registerCorsConfiguration("/**", cfg);
        return src;
    }
}