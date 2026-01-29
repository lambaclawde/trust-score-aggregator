#!/usr/bin/env python3
"""
Deploy TrustScoreOracle contract.

Usage:
    python scripts/deploy_contract.py [network]

Networks: sepolia, mainnet, base, baseSepolia
"""

import os
import subprocess
import sys

def main():
    network = sys.argv[1] if len(sys.argv) > 1 else "sepolia"

    print(f"Deploying to {network}...")

    # Change to contracts directory
    contracts_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "contracts"
    )

    # Install dependencies if needed
    if not os.path.exists(os.path.join(contracts_dir, "node_modules")):
        print("Installing dependencies...")
        subprocess.run(["npm", "install"], cwd=contracts_dir, check=True)

    # Compile contracts
    print("Compiling contracts...")
    subprocess.run(["npx", "hardhat", "compile"], cwd=contracts_dir, check=True)

    # Deploy
    print(f"Deploying to {network}...")
    result = subprocess.run(
        ["npx", "hardhat", "run", "scripts/deploy.ts", "--network", network],
        cwd=contracts_dir,
        capture_output=True,
        text=True,
    )

    print(result.stdout)
    if result.stderr:
        print(result.stderr, file=sys.stderr)

    if result.returncode != 0:
        print("Deployment failed!")
        sys.exit(1)

    print("\nDeployment complete!")
    print("Don't forget to update ORACLE_CONTRACT in your .env file")


if __name__ == "__main__":
    main()
