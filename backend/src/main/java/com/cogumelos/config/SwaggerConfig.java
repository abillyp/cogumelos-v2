/*
 * Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
 * Todos os direitos reservados.
 *
 * Este arquivo é parte do sistema cogumelos.app e está protegido pela
 * Lei Brasileira de Direitos Autorais (Lei nº 9.610/1998).
 * Uso, cópia ou distribuição não autorizados são expressamente proibidos.
 *
 * Contato: alessandro.billy@organico4you.com.br
 */

package com.cogumelos.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class SwaggerConfig {

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    private static final String SECURITY_SCHEME = "bearerAuth";

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(info())
                .servers(servers())
                .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME))
                .components(new Components()
                        .addSecuritySchemes(SECURITY_SCHEME, jwtSecurityScheme())
                );
    }

    private Info info() {
        return new Info()
                .title("cogumelos.app API")
                .description("""
                        ## API do sistema de gestão de cultivo de cogumelos
                        
                        Sistema SaaS multi-tenant para produtores de cogumelos.
                        Permite gerenciar experimentos, formulações de substrato,
                        monitoramento ambiental e análise financeira.
                        
                        ### Autenticação
                        
                        A API usa **JWT Bearer Token**. Para autenticar:
                        
                        1. Faça `POST /api/auth/login` com email e senha
                        2. Copie o `token` da resposta
                        3. Clique em **Authorize** e cole o token
                        
                        ### Multi-tenant
                        
                        Cada produtor tem um tenant isolado. Todas as queries
                        são automaticamente filtradas pelo `tenant_id` do token JWT.
                        """)
                .version("2.0.0")
                .contact(new Contact()
                        .name("Alessandro Billy Palma")
                        .email("alessandro.billy@organico4you.com.br")
                        .url("https://app.organico4you.com.br")
                )
                .license(new License()
                        .name("Proprietária — todos os direitos reservados")
                        .url("https://app.organico4you.com.br/LICENSE")
                );
    }

    private List<Server> servers() {
        return List.of(
                new Server().url("http://localhost:8080").description("Desenvolvimento local"),
                new Server().url("https://app.organico4you.com.br").description("Produção")
        );
    }

    private SecurityScheme jwtSecurityScheme() {
        return new SecurityScheme()
                .name(SECURITY_SCHEME)
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT")
                .description("Token JWT obtido via POST /api/auth/login");
    }
}
