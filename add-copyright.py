#!/usr/bin/env python3
"""
add-copyright.py
Adiciona cabeçalho de copyright em todos os arquivos .java, .ts e .tsx do projeto.
Pula arquivos que já têm o cabeçalho.

Uso:
  python add-copyright.py              # dry-run: mostra o que seria modificado
  python add-copyright.py --apply      # aplica as mudanças
  python add-copyright.py --verify     # verifica quais arquivos NÃO têm o header (para CI)
"""

import os
import sys
import argparse
from pathlib import Path

# ── Configuração ───────────────────────────────────────────────────────────────
AUTHOR      = "Alessandro Billy Palma"
PRODUCT     = "cogumelos.app"
YEAR        = "2026"
CONTACT     = "alessandro.palma@organico4you.com.br"
MARKER      = "Copyright (c)"   # string usada para detectar se header já existe

JAVA_HEADER = f"""\
/*
 * Copyright (c) {YEAR} {AUTHOR} — {PRODUCT}
 * Todos os direitos reservados.
 *
 * Este arquivo é parte do sistema {PRODUCT} e está protegido pela
 * Lei Brasileira de Direitos Autorais (Lei nº 9.610/1998).
 * Uso, cópia ou distribuição não autorizados são expressamente proibidos.
 *
 * Contato: {CONTACT}
 */
"""

TS_HEADER = f"""\
// Copyright (c) {YEAR} {AUTHOR} — {PRODUCT}
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.
// Contato: {CONTACT}
"""

# ── Pastas ignoradas ───────────────────────────────────────────────────────────
IGNORE_DIRS = {
    "node_modules", ".next", "target", ".git",
    "out", "dist", "build", "coverage",
}

# ── Arquivos ignorados (gerados automaticamente) ───────────────────────────────
IGNORE_FILES = {
    "CogumelosApplication.java",   # entry point gerado pelo Spring Initializr
}


def deve_ignorar(path: Path) -> bool:
    for part in path.parts:
        if part in IGNORE_DIRS:
            return True
    if path.name in IGNORE_FILES:
        return True
    return False


def ja_tem_header(content: str) -> bool:
    return MARKER in content[:500]  # verifica só no início do arquivo


def adicionar_header(path: Path, header: str, apply: bool) -> bool:
    """Retorna True se o arquivo foi (ou seria) modificado."""
    try:
        content = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        print(f"  [SKIP] {path} — não é UTF-8")
        return False

    if ja_tem_header(content):
        return False

    novo_content = header + "\n" + content

    if apply:
        path.write_text(novo_content, encoding="utf-8")
        print(f"  [OK]   {path}")
    else:
        print(f"  [DRY]  {path}")

    return True


def processar(raiz: str, apply: bool, verify: bool) -> int:
    """Retorna o número de arquivos modificados (ou que precisam de header no verify)."""
    raiz_path = Path(raiz)
    modificados = 0
    sem_header = []

    # Arquivos Java
    for java_file in raiz_path.rglob("*.java"):
        if deve_ignorar(java_file):
            continue
        if verify:
            content = java_file.read_text(encoding="utf-8", errors="ignore")
            if not ja_tem_header(content):
                sem_header.append(str(java_file))
        else:
            if adicionar_header(java_file, JAVA_HEADER, apply):
                modificados += 1

    # Arquivos TypeScript / TSX
    for ts_file in list(raiz_path.rglob("*.ts")) + list(raiz_path.rglob("*.tsx")):
        if deve_ignorar(ts_file):
            continue
        if ts_file.name.endswith(".d.ts"):
            continue
        if verify:
            content = ts_file.read_text(encoding="utf-8", errors="ignore")
            if not ja_tem_header(content):
                sem_header.append(str(ts_file))
        else:
            if adicionar_header(ts_file, TS_HEADER, apply):
                modificados += 1

    if verify:
        if sem_header:
            print(f"\n❌ {len(sem_header)} arquivo(s) sem cabeçalho de copyright:\n")
            for f in sem_header:
                print(f"   {f}")
            return len(sem_header)
        else:
            print("✅ Todos os arquivos têm cabeçalho de copyright.")
            return 0

    return modificados


def main():
    parser = argparse.ArgumentParser(
        description="Adiciona cabeçalho de copyright em arquivos .java, .ts e .tsx"
    )
    parser.add_argument(
        "raiz",
        nargs="?",
        default=".",
        help="Raiz do projeto (padrão: diretório atual)",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Aplica as mudanças (sem este flag, roda em dry-run)",
    )
    parser.add_argument(
        "--verify",
        action="store_true",
        help="Verifica quais arquivos NÃO têm o header (modo CI — retorna código 1 se falhar)",
    )
    args = parser.parse_args()

    if args.verify:
        print(f"🔍 Verificando headers em: {args.raiz}\n")
        total = processar(args.raiz, apply=False, verify=True)
        sys.exit(1 if total > 0 else 0)

    modo = "APLICANDO" if args.apply else "DRY-RUN (use --apply para aplicar)"
    print(f"\n{'='*60}")
    print(f"  Cabeçalho de copyright — {modo}")
    print(f"  Raiz: {args.raiz}")
    print(f"{'='*60}\n")

    total = processar(args.raiz, apply=args.apply, verify=False)

    if args.apply:
        print(f"\n✅ {total} arquivo(s) atualizado(s).")
    else:
        print(f"\n📋 {total} arquivo(s) seriam modificados. Rode com --apply para aplicar.")


if __name__ == "__main__":
    main()
