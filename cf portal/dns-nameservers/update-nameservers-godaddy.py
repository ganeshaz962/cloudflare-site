#!/usr/bin/env python3
"""
GoDaddy Nameserver Update Automation

Idempotent script to update domain nameservers via GoDaddy API v1
"""

import argparse
import sys
from pathlib import Path

import requests
import yaml


def normalize_ns(nameservers):
    """Normalize nameservers to lowercase and strip trailing dots"""
    return [ns.lower().rstrip('.') for ns in nameservers]


def get_current_nameservers(session, api_url, domain):
    """Fetch current nameservers from GoDaddy API"""
    url = f"{api_url}/v1/domains/{domain}"

    try:
        response = session.get(url, timeout=30)

        if response.status_code == 400:
            print(f"  Bad request: {response.text}")
            return None

        if response.status_code == 401:
            print(f"  Authentication failed: {response.text}")
            return None

        if response.status_code == 403:
            print(f"  Access denied: {response.text}")
            return None

        if response.status_code == 404:
            print(f"  Domain not found: {domain}")
            return None

        response.raise_for_status()
        data = response.json()
        nameservers = data.get('nameServers', [])
        return normalize_ns(nameservers)

    except requests.exceptions.RequestException as e:
        print(f"  Error fetching {domain}: {e}")
        return None


def update_nameservers(session, api_url, domain, nameservers):
    """Update nameservers via GoDaddy API"""
    url = f"{api_url}/v1/domains/{domain}"

    payload = {
        'nameServers': nameservers
    }

    try:
        response = session.patch(url, json=payload, timeout=30)

        if response.status_code == 422:
            print(f"  Validation error: {response.text}")
            return False

        response.raise_for_status()
        return True

    except requests.exceptions.RequestException as e:
        print(f"  Update failed: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"  Response: {e.response.text}")
        return False


def process_domain(session, api_url, domain, desired_ns, dry_run):
    """Process a single domain: check and update if needed"""
    print(f"\n{domain}:")

    # Get current nameservers
    current_ns = get_current_nameservers(session, api_url, domain)
    if current_ns is None:
        return 'failed'

    # Compare
    if set(current_ns) == set(desired_ns):
        print(f"  Already correct: {sorted(current_ns)}")
        return 'unchanged'

    # Show difference
    print(f"  Current: {sorted(current_ns)}")
    print(f"  Desired: {sorted(desired_ns)}")

    if dry_run:
        print(f"  Dry-run: would update")
        return 'skipped'

    # Update
    if update_nameservers(session, api_url, domain, desired_ns):
        print(f"  Updated successfully")
        return 'updated'
    else:
        return 'failed'


def load_domains(config_path):
    """Load domain configuration from YAML"""
    with open(config_path, 'r') as f:
        data = yaml.safe_load(f)

    result = []
    for item in data.get('domains', []):
        for domain, nameservers in item.items():
            result.append({
                'domain': domain.lower().rstrip('.'),
                'nameservers': normalize_ns(nameservers)
            })

    return result


def main():
    parser = argparse.ArgumentParser(description='Update domain nameservers in GoDaddy')

    parser.add_argument('--config', type=Path, default=Path('domains.yaml'),
                        help='Path to domain configuration file (default: domains.yaml)')
    parser.add_argument('--api-url', default='https://api.godaddy.com',
                        help='GoDaddy API base URL (default: https://api.godaddy.com)')
    parser.add_argument('--api-key', required=True,
                        help='GoDaddy API key (from developer.godaddy.com)')
    parser.add_argument('--api-secret', required=True,
                        help='GoDaddy API secret (from developer.godaddy.com)')
    parser.add_argument('--dry-run', action='store_true',
                        help='Preview changes without applying them')
    parser.add_argument('--no-verify-ssl', action='store_true',
                        help='Disable SSL certificate verification (use in corporate proxy environments)')
    parser.add_argument('--ca-bundle', type=Path, default=None,
                        help='Path to custom CA certificate bundle (.pem) for SSL verification')

    args = parser.parse_args()

    try:
        # Load configuration
        domains = load_domains(args.config)
        print(f"Loaded {len(domains)} domain(s) from {args.config}")

        if args.dry_run:
            print("DRY-RUN MODE: No changes will be applied\n")

        # Setup session with GoDaddy sso-key auth
        api_url = args.api_url.rstrip('/')
        session = requests.Session()
        session.headers.update({
            'Authorization': f'sso-key {args.api_key}:{args.api_secret}',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })

        if args.no_verify_ssl:
            import urllib3
            urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
            session.verify = False
            print("WARNING: SSL verification disabled\n")
        elif args.ca_bundle:
            session.verify = str(args.ca_bundle)
            print(f"Using CA bundle: {args.ca_bundle}\n")

        # Process domains
        results = {'unchanged': 0, 'updated': 0, 'skipped': 0, 'failed': 0}

        for domain_config in domains:
            domain = domain_config['domain']
            nameservers = domain_config['nameservers']

            status = process_domain(
                session,
                api_url,
                domain,
                nameservers,
                args.dry_run
            )
            results[status] += 1

        # Print summary
        print("\n" + "=" * 60)
        print(f"Total: {len(domains)} | Unchanged: {results['unchanged']} | "
              f"Updated: {results['updated']} | Skipped: {results['skipped']} | "
              f"Failed: {results['failed']}")
        print("=" * 60)

    except FileNotFoundError:
        print(f"Error: Config file not found: {args.config}")
        sys.exit(1)
    except yaml.YAMLError as e:
        print(f"Error parsing YAML config: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
