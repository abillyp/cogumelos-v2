/*
 * Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
 * Todos os direitos reservados.
 *
 * Este arquivo é parte do sistema cogumelos.app e está protegido pela
 * Lei Brasileira de Direitos Autorais (Lei nº 9.610/1998).
 * Uso, cópia ou distribuição não autorizados são expressamente proibidos.
 *
 * Contato: alessandro.palma@organico4you.com.br
 */

package com.cogumelos.security;

public class TenantContext {

    private static final ThreadLocal<Long> tenantId = new ThreadLocal<>();
    private static final ThreadLocal<String> plano = new ThreadLocal<>();

    public static void setTenantId(Long id) { tenantId.set(id); }
    public static Long getTenantId() { return tenantId.get(); }

    public static void setPlano(String p) { plano.set(p); }
    public static String getPlano() { return plano.get(); }

    public static void clear() {
        tenantId.remove();
        plano.remove();
    }
}
