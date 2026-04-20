#!/usr/bin/env python3
"""
CSC Domain Manager Nameserver Update Automation

Idempotent script to update domain nameservers via CSC API v2
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
    """Fetch current nameservers from CSC API"""
    url = f"{api_url}/domains/{domain}"

    try:
        response = session.get(url, timeout=30)

        if response.status_code == 401:
            print(f"Authentication failed: Invalid bearer token or API key")
            return None

        if response.status_code == 403:
            print(f"Access denied: No permission to access {domain}")
            return None

        if response.status_code == 404:
            print(f"Domain not found: {domain}")
            return None

        response.raise_for_status()
        data = response.json()
        nameservers = data.get('nameServers', [])
        return normalize_ns(nameservers)

    except requests.exceptions.RequestException as e:
        print(f"Error fetching {domain}: {e}")
        return None


def update_nameservers(session, api_url, domain, nameservers, notification_email):
    """Update nameservers via CSC API"""
    url = f"{api_url}/domains/nsmodification"

    payload = {
        'qualifiedDomainName': domain,
        'nameServers': nameservers,
        'dnsType': 'OTHER_DNS',
        'notifications': {
            'enabled': True,
            'additionalNotificationEmails': [notification_email]
        },
        'showPrice': True
    }

    try:
        response = session.put(url, json=payload, timeout=30)
        response.raise_for_status()
        return True
    except requests.exceptions.RequestException as e:
        print(f"Update failed: {e}")
        if hasattr(e, 'response') and e.response:
            print(f"Response: {e.response.text}")
        return False


def process_domain(session, api_url, domain, desired_ns, notification_email, dry_run):
    """Process a single domain: check and update if needed"""
    print(f"\n{domain}:")

    # Get current nameservers
    current_ns = get_current_nameservers(session, api_url, domain)
    if current_ns is None:
        return 'failed'

    # Compare
    if set(current_ns) == set(desired_ns):
        print(f"Already correct")
        return 'unchanged'

    # Show difference
    print(f"Current: {sorted(current_ns)}")
    print(f"Desired: {sorted(desired_ns)}")

    if dry_run:
        print(f"Dry-run: would update")
        return 'skipped'

    # Update
    if update_nameservers(session, api_url, domain, desired_ns, notification_email):
        print(f"Updated successfully")
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
    parser = argparse.ArgumentParser(description='Update domain nameservers in CSC Domain Manager')

    parser.add_argument('--config', type=Path, default=Path('domains.yaml'),
                        help='Path to domain configuration file (default: domains.yaml)')
    parser.add_argument('--api-url', default='https://apis.cscglobal.com/dbs/api/v2',
                        help='CSC Domain Manager API v2 base URL')
    parser.add_argument('--bearer-token', required=True,
                        help='CSC API Bearer token')
    parser.add_argument('--api-key', required=True,
                        help='CSC API key')
    parser.add_argument('--notification-email', default='cdx@sas.se',
                        help='Email address for notifications (default: cdx@sas.se)')
    parser.add_argument('--dry-run', action='store_true',
                        help='Preview changes without applying them')

    args = parser.parse_args()

    try:
        # Load configuration
        domains = load_domains(args.config)
        print(f"Loaded {len(domains)} domain(s) from {args.config}")

        if args.dry_run:
            print("DRY-RUN MODE: No changes will be applied\n")

        # Setup session with auth
        api_url = args.api_url.rstrip('/')
        session = requests.Session()
        session.headers.update({
            'Authorization': f'Bearer {args.bearer_token}',
            'apikey': args.api_key,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })

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
                args.notification_email,
                args.dry_run
            )
            results[status] += 1

        # Print summary
        print("\n" + "="*60)
        print(f"Total: {len(domains)} | Unchanged: {results['unchanged']} | "
              f"Updated: {results['updated']} | Skipped: {results['skipped']} | "
              f"Failed: {results['failed']}")
        print("="*60)

        # Exit with error if any failed
        if results['failed'] > 0:
            sys.exit(1)

    except Exception as e:
        print(f"\nError: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()