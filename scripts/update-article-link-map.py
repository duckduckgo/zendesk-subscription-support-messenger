#!/usr/bin/env python3
"""
Script to update ARTICLE_LINK_MAP in src/config/zendesk.ts
from the master JSON mapping file.
"""

import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

# Paths
SCRIPT_DIR = Path(__file__).parent.resolve()
PROJECT_ROOT = SCRIPT_DIR.parent
ZENDESK_CONFIG = PROJECT_ROOT / "src" / "config" / "zendesk.ts"

# Git repository configuration
REPO_URL = "https://dub.duckduckgo.com/duckduckgo/help-pages-cms.git"
FILE_PATH = "scripts/zendesk-sync/zendesk-mapping.json"
BRANCH = "main"


def fetch_file_with_sparse_checkout(
    repo_url: str,
    file_path: str,
    branch: str = "main",
) -> dict:
    """
    Fetch a single file from a git repository using a sparse checkout.

    Clones only the specified file into a temporary directory using
    --depth=1 --filter=blob:none --sparse, then reads and returns the
    parsed JSON content. The temporary directory is always cleaned up.

    Args:
        repo_url: Git repository URL
        file_path: Path to the file within the repository
        branch: Branch name (default: main)

    Returns:
        Parsed JSON data as dictionary

    Raises:
        subprocess.CalledProcessError: If a git command fails
        json.JSONDecodeError: If the file is not valid JSON
        FileNotFoundError: If the file is not present after checkout
    """
    tmp_dir = tempfile.mkdtemp()

    try:
        subprocess.run(
            [
                "git", "clone",
                "--depth=1",
                "--filter=blob:none",
                "--sparse",
                "--branch", branch,
                repo_url,
                tmp_dir,
            ],
            check=True,
            capture_output=True,
        )

        subprocess.run(
            ["git", "-C", tmp_dir, "sparse-checkout", "set", "--no-cone", file_path],
            check=True,
            capture_output=True,
        )

        subprocess.run(
            ["git", "-C", tmp_dir, "checkout"],
            check=True,
            capture_output=True,
        )

        target = Path(tmp_dir) / file_path

        if not target.exists():
            raise FileNotFoundError(f"File {file_path} not found after checkout")

        return json.loads(target.read_text())
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


def generate_article_link_map(mapping_data: dict) -> str:
    """Generate ARTICLE_LINK_MAP entries from JSON mapping data."""
    files = mapping_data.get("files", {})

    # Transform: value (article ID) -> key, key (path) -> value
    # Remove .mdx extension and add leading slash
    article_map = {}
    for file_path, article_id in files.items():
        clean_path = file_path.replace(".mdx", "")
        article_map[article_id] = f"/{clean_path}"

    # Sort by article ID (as string for consistent ordering)
    sorted_items = sorted(article_map.items(), key=lambda x: x[0])

    # Generate TypeScript map entries
    entries = []
    for article_id, path in sorted_items:
        entries.append(f"  '{article_id}': '{path}'")

    return ",\n".join(entries)


def update_zendesk_config(config_path: Path, new_map_entries: str) -> None:
    """Update ARTICLE_LINK_MAP in the zendesk config file."""
    content = config_path.read_text()

    # Pattern to match ARTICLE_LINK_MAP block
    # Matches from "export const ARTICLE_LINK_MAP" to "} as const;" or "};"
    pattern = re.compile(
        r"(export const ARTICLE_LINK_MAP: Record<string, string> = \{)(.*?)(\} as const;)",
        re.DOTALL,
    )

    def replace_map(match):
        return f"{match.group(1)}\n{new_map_entries}\n{match.group(3)}"

    new_content = pattern.sub(replace_map, content)

    if new_content == content:
        # Try alternative pattern without "as const"
        pattern_alt = re.compile(
            r"(export const ARTICLE_LINK_MAP: Record<string, string> = \{)(.*?)(\};)",
            re.DOTALL,
        )
        new_content = pattern_alt.sub(
            lambda m: f"{m.group(1)}\n{new_map_entries}\n}} as const;",
            content,
        )

    if new_content == content:
        raise ValueError("Could not find ARTICLE_LINK_MAP in config file")

    config_path.write_text(new_content)


def main():
    """Main execution."""
    if not ZENDESK_CONFIG.exists():
        print(
            f"Error: Zendesk config file not found at: {ZENDESK_CONFIG}",
            file=sys.stderr,
        )
        sys.exit(1)

    print(f"Fetching {FILE_PATH} from {REPO_URL} (branch: {BRANCH})")
    print(f"Updating: {ZENDESK_CONFIG}")

    try:
        mapping_data = fetch_file_with_sparse_checkout(REPO_URL, FILE_PATH, BRANCH)
    except subprocess.CalledProcessError as e:
        stderr = e.stderr.decode() if isinstance(e.stderr, bytes) else (e.stderr or "")
        print(f"Error: Git command failed: {stderr.strip()}", file=sys.stderr)
        sys.exit(1)
    except FileNotFoundError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in mapping file: {e}", file=sys.stderr)
        sys.exit(1)

    map_entries = generate_article_link_map(mapping_data)

    try:
        update_zendesk_config(ZENDESK_CONFIG, map_entries)
    except ValueError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

    print("✅ Successfully updated ARTICLE_LINK_MAP")
    print("")
    print("Note: Please review the changes and run 'npm run build' to verify.")


if __name__ == "__main__":
    main()
