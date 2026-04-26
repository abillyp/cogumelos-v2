#!/usr/bin/env python3
"""
replace-email.py
Substitui alessandro.billy@organico4you.com.br pelo email real em todos os arquivos do projeto.

Uso:
  python replace-email.py              # dry-run
  python replace-email.py --apply      # aplica as mudanças
"""

import os
import sys
import argparse
from pathlib import Path

OLD_EMAIL = "alessandro.billy@organico4you.com.br"
NEW_EMAIL = "alessandro.billy@organico4you.com.br"

IGNORE_DIRS = {
    "node_modules", ".next", "target", ".git",
    "out", "dist", "build", "coverage",
}

EXTENSIONS = {
    ".java", ".ts", ".tsx", ".js", ".jsx",
    ".yml", ".yaml", ".md", ".txt", ".py",
    "LICENSE",
}


def deve_ignorar(path: Path) -> bool:
    for part in path.parts:
        if part in IGNORE_DIRS:
            return True
    return False


def processar(raiz: str, apply: bool) -> int:
    raiz_path = Path(raiz)
    modificados = 0

    for arquivo in raiz_path.rglob("*"):
        if not arquivo.is_file():
            continue
        if deve_ignorar(arquivo):
            continue
        if arquivo.suffix not in EXTENSIONS and arquivo.name not in EXTENSIONS:
            continue

        try:
            content = arquivo.read_text(encoding="utf-8")
        except (UnicodeDecodeError, PermissionError):
            continue

        if OLD_EMAIL not in content:
            continue

        novo_content = content.replace(OLD_EMAIL, NEW_EMAIL)
        count = content.count(OLD_EMAIL)

        if apply:
            arquivo.write_text(novo_content, encoding="utf-8")
            print(f"  [OK]   {arquivo}  ({count} ocorrência{'s' if count > 1 else ''})")
        else:
            print(f"  [DRY]  {arquivo}  ({count} ocorrência{'s' if count > 1 else ''})")

        modificados += 1

    return modificados


def main():
    parser = argparse.ArgumentParser(description="Troca o email de contato em todos os arquivos do projeto")
    parser.add_argument("raiz", nargs="?", default=".", help="Raiz do projeto (padrão: diretório atual)")
    parser.add_argument("--apply", action="store_true", help="Aplica as mudanças")
    args = parser.parse_args()

    modo = "APLICANDO" if args.apply else "DRY-RUN (use --apply para aplicar)"
    print(f"\n{'='*60}")
    print(f"  Substituição de email — {modo}")
    print(f"  DE:   {OLD_EMAIL}")
    print(f"  PARA: {NEW_EMAIL}")
    print(f"  Raiz: {args.raiz}")
    print(f"{'='*60}\n")

    total = processar(args.raiz, args.apply)

    if args.apply:
        print(f"\n✅ {total} arquivo(s) atualizado(s).")
    else:
        print(f"\n📋 {total} arquivo(s) seriam modificados. Rode com --apply para aplicar.")


if __name__ == "__main__":
    main()
